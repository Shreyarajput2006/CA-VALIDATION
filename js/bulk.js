// ===================== BULK VALIDATION MODULE =====================
// Depends on: script.js (verifyPANLive, verifyTANLive, verifyEmailLive,
// verifyMobileLive, saveHistoryToDB, loadStats, loadHistory), XLSX (SheetJS),
// pdfjsLib (PDF.js), jsPDF + autoTable.
// GST & Aadhaar are NOT included because they need a live captcha/OTP per
// request, so they can't be validated unattended in bulk.

(function () {
  const bulkType = document.getElementById("bulkType");
  const bulkFileInput = document.getElementById("bulkFileInput");
  const bulkStartBtn = document.getElementById("bulkStartBtn");
  const bulkProgressBox = document.getElementById("bulkProgressBox");
  const bulkProgressFill = document.getElementById("bulkProgressFill");
  const bulkProgressText = document.getElementById("bulkProgressText");
  const bulkResultBox = document.getElementById("bulkResultBox");
  const bulkTableHead = document.getElementById("bulkTableHead");
  const bulkTableBody = document.getElementById("bulkTableBody");
  const bulkTotalEl = document.getElementById("bulkTotal");
  const bulkValidEl = document.getElementById("bulkValid");
  const bulkInvalidEl = document.getElementById("bulkInvalid");

  if (!bulkStartBtn) return; // section not present on this page

  let bulkResults = []; // [{ fields: {...}, isValid, remarks }]

  // ---------- Column order shown per type (matches the single-validation result card) ----------
  const COLUMNS = {
   pan: ["PAN", "Full Name", "Status"],
    tan: ["TAN", "Name as per TAN", "PAN", "PAN Name", "Category", "Status"],
    email: [
      "Email",
      "Status",
      "Status Detail",
      "Format Valid",
      "SMTP Valid",
      "MX Valid",
      "Disposable",
      "Free Email",
      "Risk Status",
    ],
    mobile: ["Number", "Carrier", "Line Type", "Line Status", "Risk Level"],
  };

  // ---------- Per-type config: strict format check + live verify call ----------
  const VALIDATORS = {
        pan: {
      label: "PAN",
      formatRegex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      extractRegex: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
      verify: async (value) => {
        const r = await verifyPANLive(value);
        if (r && r.data) {
          const d = r.data;
          const ok = d.status === "Valid and Operative";
          return {
            isValid: ok,
            fields: {
              PAN: d.pan || value,
              "Full Name": d.fullNameAsPan || "-",
              Status: d.status || "-",
            },
          };
        }
        return {
          isValid: false,
          fields: { PAN: value, "Full Name": "-", Status: "Verification Failed" },
        };
      },
    },
    tan: {
      label: "TAN",
      formatRegex: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
      extractRegex: /[A-Z]{4}[0-9]{5}[A-Z]{1}/g,
      verify: async (value) => {
        const r = await verifyTANLive(value);
        if (r && r.data) {
          const d = r.data;
          return {
            isValid: true,
            fields: {
              TAN: value,
              "Name as per TAN": d.nameAsPerTan || "-",
              PAN: d.panCode || "-",
              "PAN Name": d.panName || "-",
              Category: d.category || "-",
              Status: "Valid",
            },
          };
        }
        return {
          isValid: false,
          fields: {
            TAN: value,
            "Name as per TAN": "-",
            PAN: "-",
            "PAN Name": "-",
            Category: "-",
            Status: "Verification Failed",
          },
        };
      },
    },
    email: {
      label: "EMAIL",
      formatRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      extractRegex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      verify: async (value) => {
        const r = await verifyEmailLive(value);
        if (r && r.success) {
          return {
            isValid: r.valid === true,
            fields: {
              Email: r.email || value,
              Status: r.status || "-",
              "Status Detail": r.status_detail || "-",
              "Format Valid": r.is_format_valid ? "Yes" : "No",
              "SMTP Valid": r.is_smtp_valid ? "Yes" : "No",
              "MX Valid": r.is_mx_valid ? "Yes" : "No",
              Disposable: r.is_disposable ? "Yes" : "No",
              "Free Email": r.is_free_email ? "Yes" : "No",
              "Risk Status": r.risk_status || "-",
            },
          };
        }
        return {
          isValid: false,
          fields: {
            Email: value,
            Status: "Verification Failed",
            "Status Detail": "-",
            "Format Valid": "-",
            "SMTP Valid": "-",
            "MX Valid": "-",
            Disposable: "-",
            "Free Email": "-",
            "Risk Status": "-",
          },
        };
      },
    },
    mobile: {
      label: "MOBILE",
      formatRegex: /^[6-9]\d{9}$/,
      extractRegex: /\b[6-9]\d{9}\b/g,
      verify: async (value) => {
        const r = await verifyMobileLive(value);
        if (r && r.phone_validation) {
          const ok = r.phone_validation.is_valid === true;
          return {
            isValid: ok,
            fields: {
              Number: r.phone_number || value,
              Carrier: r.phone_carrier?.name || "-",
              "Line Type": r.phone_carrier?.line_type || "-",
              "Line Status": r.phone_validation.line_status || "-",
              "Risk Level": r.phone_risk?.risk_level || "-",
            },
          };
        }
        return {
          isValid: false,
          fields: {
            Number: value,
            Carrier: "-",
            "Line Type": "-",
            "Line Status": "-",
            "Risk Level": "-",
          },
        };
      },
    },
  };

  // Blank/failure-shaped fields, used for format-invalid or thrown-error rows
  function blankFields(type, value) {
    const cols = COLUMNS[type];
    const fields = {};
    cols.forEach((c) => (fields[c] = "-"));
    // put the raw entered value into the identifier column (always the first one)
    fields[cols[0]] = value;
    if (cols.includes("Status")) fields["Status"] = "Verification Failed";
    return fields;
  }

  // ---------- Step 1: read the uploaded file and pull out candidate values ----------
  async function extractValuesFromFile(file, type) {
    const ext = file.name.split(".").pop().toLowerCase();
    const validator = VALIDATORS[type];

    if (ext === "csv" || ext === "xlsx" || ext === "xls") {
      return await extractFromSpreadsheet(file);
    } else if (ext === "pdf") {
      return await extractFromPDF(file, validator);
    }
    throw new Error("Unsupported file type. Please upload a .csv, .xlsx or .pdf file.");
  }

  function extractFromSpreadsheet(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          const values = [];
          rows.forEach((row) => {
            row.forEach((cell) => {
              const val = String(cell || "").trim().toUpperCase();
              if (val) values.push(val);
            });
          });

          resolve([...new Set(values)]);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Could not read the file."));
      reader.readAsArrayBuffer(file);
    });
  }

  async function extractFromPDF(file, validator) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += " " + content.items.map((it) => it.str).join(" ");
    }

    fullText = fullText.toUpperCase();
    const matches = fullText.match(validator.extractRegex) || [];
    return [...new Set(matches)];
  }

  // ---------- Build the table header for the selected type ----------
  function buildTableHeader(type) {
    const cols = COLUMNS[type];
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<th>#</th>" +
      cols.map((c) => `<th>${c}</th>`).join("") +
      "<th>Result</th><th>Remarks</th>";
    bulkTableHead.innerHTML = "";
    bulkTableHead.appendChild(tr);
  }

  // ---------- Step 2: validate each value one by one, updating progress ----------
  async function runBulkValidation(values, type) {
    const validator = VALIDATORS[type];
    const cols = COLUMNS[type];
    bulkResults = [];
    bulkTableBody.innerHTML = "";
    buildTableHeader(type);
    bulkProgressBox.style.display = "block";
    bulkResultBox.style.display = "none";

    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      bulkProgressText.textContent = `Validating ${i + 1} / ${values.length} — ${value}`;
      bulkProgressFill.style.width = `${Math.round(((i + 1) / values.length) * 100)}%`;

      let isValid = false;
      let fields;
      let remarks = "";

      if (!validator.formatRegex.test(value)) {
        fields = blankFields(type, value);
        remarks = "Invalid format — skipped API check";
      } else {
        try {
          const apiResult = await validator.verify(value);
          isValid = apiResult.isValid;
          fields = apiResult.fields;
        } catch (err) {
          fields = blankFields(type, value);
          remarks = "API error: " + err.message;
        }

        try {
          await saveHistoryToDB(validator.label, value, isValid ? "Valid" : "Invalid");
        } catch (e) {
          /* history save failing shouldn't stop the batch */
        }

        await new Promise((r) => setTimeout(r, 600));
      }

      isValid ? validCount++ : invalidCount++;
      bulkResults.push({ fields, isValid, remarks });

      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td>${i + 1}</td>` +
        cols.map((c) => `<td>${fields[c]}</td>`).join("") +
        `<td class="${isValid ? "status-valid" : "status-invalid"}">${isValid ? "Valid" : "Invalid"}</td>` +
        `<td>${remarks || "-"}</td>`;
      bulkTableBody.appendChild(tr);
    }

    bulkProgressBox.style.display = "none";
    bulkResultBox.style.display = "block";
    bulkTotalEl.textContent = values.length;
    bulkValidEl.textContent = validCount;
    bulkInvalidEl.textContent = invalidCount;

    if (typeof loadStats === "function") loadStats();
    if (typeof loadHistory === "function") loadHistory();
  }

  // ---------- Start button ----------
  bulkStartBtn.addEventListener("click", async () => {
    const file = bulkFileInput.files[0];
    const type = bulkType.value;

    if (!file) {
      alert("Please select a file first.");
      return;
    }

    bulkStartBtn.disabled = true;
    bulkStartBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reading File...';

    try {
      const values = await extractValuesFromFile(file, type);
      if (!values.length) {
        alert(`No values found that look like a ${VALIDATORS[type].label} in this file.`);
        return;
      }
      await runBulkValidation(values, type);
    } catch (err) {
      console.error("Bulk validation error:", err);
      alert(err.message || "Failed to process the file.");
    } finally {
      bulkStartBtn.disabled = false;
      bulkStartBtn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Start Bulk Validation';
    }
  });

  // ---------- Exports (Excel, JSON, PDF all carry the full field set) ----------
  document.getElementById("bulkExportExcel").addEventListener("click", () => {
    if (!bulkResults.length) return alert("No results to export yet.");
    const cols = COLUMNS[bulkType.value];
    const data = bulkResults.map((r, i) => {
      const row = { "#": i + 1 };
      cols.forEach((c) => (row[c] = r.fields[c]));
      row["Result"] = r.isValid ? "Valid" : "Invalid";
      row["Remarks"] = r.remarks || "-";
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulk Validation");
    XLSX.writeFile(wb, `Bulk_Validation_${bulkType.value}_${Date.now()}.xlsx`);
  });

    document.getElementById("bulkExportJson").addEventListener("click", () => {
    if (!bulkResults.length) return alert("No results to export yet.");
    const cols = COLUMNS[bulkType.value];
    const data = bulkResults.map((r, i) => {
      const row = { "#": i + 1 };
      cols.forEach((c) => (row[c] = r.fields[c]));
      row["Result"] = r.isValid ? "Valid" : "Invalid";
      row["Remarks"] = r.remarks || "-";
      return row;
    });

    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bulk_Validation_${bulkType.value}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("bulkExportPdf").addEventListener("click", () => {
    if (!bulkResults.length) return alert("No results to export yet.");
    const cols = COLUMNS[bulkType.value];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(`Bulk ${VALIDATORS[bulkType.value].label} Validation Report`, 12, 13);

    doc.autoTable({
      startY: 26,
      head: [["#", ...cols, "Result", "Remarks"]],
      body: bulkResults.map((r, i) => [
        i + 1,
        ...cols.map((c) => r.fields[c]),
        r.isValid ? "Valid" : "Invalid",
        r.remarks || "-",
      ]),
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 7, cellPadding: 2 },
      didParseCell: (data) => {
        const resultColIndex = cols.length + 1;
        if (data.section === "body" && data.column.index === resultColIndex) {
          data.cell.styles.textColor = data.cell.raw === "Valid" ? [0, 128, 0] : [200, 0, 0];
        }
      },
    });

    doc.save(`Bulk_Validation_${bulkType.value}_${Date.now()}.pdf`);
  });
})();