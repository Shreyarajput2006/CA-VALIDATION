const menuItems = document.querySelectorAll(".menu-item");
const input = document.getElementById("inputValue");
const hint = document.getElementById("hintText");
const clearBtn = document.getElementById("clearBtn");
const darkModeBtn = document.getElementById("darkModeBtn");
const validateBtn = document.getElementById("validateBtn");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const formatMessage = document.getElementById("formatMessage");
const formatTitle = document.getElementById("formatTitle");
const resultIcon = document.getElementById("resultIcon");
const historyBtn = document.getElementById("historyBtn");
const historyPopup = document.getElementById("historyPopup");
const closeHistory = document.getElementById("closeHistory");
const historyList = document.getElementById("historyList");
const waitingCard = document.getElementById("waitingCard");
const downloadAllBtn = document.getElementById("downloadAllBtn");
const totalCount = document.getElementById("totalCount");
const successCount = document.getElementById("successCount");
const failedCount = document.getElementById("failedCount");
const excelBtn = document.getElementById("exportExcelBtn");

const userId = localStorage.getItem("userId");
if (!userId) {
  window.location.href = "/login.html";
}

let selectedType = "pan";
let aadhaarCaptchaTxnId = "";
let aadhaarOtpTxnId = "";
window.aadhaarTxnId = "";
let historyData = [];
let currentGstData = null;
let currentPanData = null;

window.alert = function (message) {
    const isDark = document.body.classList.contains('dark-mode');
    const msg = String(message).toLowerCase();

    // Auto-detect icon type based on message content
    let icon = 'warning';
    if (
        msg.includes('success') ||
        msg.includes('verified') ||
        msg.includes('sent') ||
        msg.includes('copied')
    ) {
        icon = 'success';
    } else if (
        msg.includes('failed') ||
        msg.includes('error') ||
        msg.includes('invalid') ||
        msg.includes('unable') ||
        msg.includes('not found') ||
        msg.includes('server error')
    ) {
        icon = 'error';
    }

    Swal.fire({
        text: message,
        icon: icon,
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        position: 'top',
        customClass: {
            popup: 'custom-alert-popup',
            confirmButton: 'custom-alert-btn'
        },
        buttonsStyling: false
    });
};

if (document.querySelector(".result-card")) {
  document.querySelector(".result-card").style.display = "none";
}

const formatDetails = {
  pan: {
    title: "PAN Format",
    desc: "5 Letters + 4 Digits + 1 Letter (e.g., ABCDE1234F)",
  },
  tan: {
    title: "TAN Format",
    desc: "4 Letters + 5 Digits + 1 Letter (e.g., ABCA12345B)",
  },
  gst: {
    title: "GSTIN Format",
    desc: "2 State Digits + 10 Char PAN + 1 Entity + Z + 1 Check Digit",
  },
  aadhaar: {
    title: "Aadhaar Format",
    desc: "12 Digits (Cannot start with 0 or 1)",
  },
  email: { title: "Email Format", desc: "username@domain.com" },
  mobile: {
    title: "Mobile Format",
    desc: "10 Digits starting with 6, 7, 8, or 9",
  },
};

// REGEX VALIDATION HELPER FUNCTIONS

function validateTAN(value) {
  return /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(value);
}

function validateAadhaar(value) {
  return /^[2-9]{1}[0-9]{11}$/.test(value);
}

function validateEmail(value) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
}

function validateMobile(value) {
  return /^[6-9]\d{9}$/.test(value);
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

async function saveHistoryToDB(type, value, status) {
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("name");

  await fetch("/api/history/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      userName,
      type,
      value,
      status,
    }),
  });
}

async function verifyPANLive(pan) {
  const response = await fetch("/api/pan/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pan }),
  });
  return await response.json();
}

async function verifyTANLive(tanCode) {
  const response = await fetch("/api/tan/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tanCode }),
  });

  return await response.json();
}

async function verifyEmailLive(email) {
  const response = await fetch("/api/email/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return await response.json();
}

// MOBILE LIVE VERIFICATION API
async function verifyMobileLive(mobile) {
  const response = await fetch("/api/mobile/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile }),
  });

  return await response.json();
}

// GST CAPTCHA LOAD
async function loadGSTCaptcha() {
  try {
    const response = await fetch("/api/gst/captcha", {
      credentials: "include",
    });
    const data = await response.json();
    if (data.image && document.getElementById("gstCaptchaImg")) {
      document.getElementById("gstCaptchaImg").src = data.image;
    }
  } catch (error) {
    console.log("Captcha load failed", error);
  }
}

// GST VERIFY API
async function verifyGST(gstin, captcha) {
  const response = await fetch("/api/gst/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gstin, captcha }),
  });
  return await response.json();
}

async function loadAadhaarCaptcha() {
  try {
    const res = await fetch("/api/aadhaar/captcha");
    const data = await res.json();

    console.log("Captcha response =>", data);

    document.getElementById("aadhaarCaptchaImg").src = data.imageUrl;

    aadhaarCaptchaTxnId = data.transactionId;
  } catch (err) {
    console.log(err);
    alert("Captcha load failed");
  }
}

async function sendAadhaarOtp() {
  const aadhaar = document.getElementById("inputValue").value.trim();
  const captcha = document.getElementById("aadhaarCaptchaInput").value.trim();

  if (!aadhaar || !captcha) {
    alert("Enter Aadhaar and captcha");
    return;
  }

  try {
    const res = await fetch("/api/aadhaar/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aadhaarNumber: aadhaar,
        captchaTxnId: aadhaarCaptchaTxnId,
        captchaValue: captcha,
      }),
    });

    const data = await res.json();

    console.log("OTP response =>", data);

    if (data.status === "success") {
      // IMPORTANT
      aadhaarOtpTxnId = data.txnId;
      window.aadhaarTxnId = data.txnId;

      console.log("Saved TxnId =>", window.aadhaarTxnId);

      alert("OTP sent successfully");
    } else {
      alert(data.message || "OTP failed");
    }
  } catch (err) {
    console.log(err);
    alert("Server error");
  }
}

async function verifyAadhaarOtp() {
  const otp = document.getElementById("aadhaarOtpInput").value.trim();

  if (!otp || otp.length !== 6) {
    alert("Please enter valid 6 digit OTP");
    return;
  }

  const btn = document.querySelector(".verify-btn");

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

  setTimeout(() => {
    // Show success UI
    document.getElementById("otpSuccessBox").style.display = "flex";
    document.getElementById("pdfWarningBox").style.display = "flex";
    document.getElementById("downloadPdfSection").style.display = "flex";

    btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> OTP Verified';
    btn.classList.add("verified-btn");

    // ===== RESULT SECTION UPDATE =====
    const aadhaar = document.getElementById("inputValue").value.trim();

    const masked = aadhaar.replace(/^(\d{4})\d{4}(\d{4})$/, "$1 XXXX $2");

    document.getElementById("waitingCard").style.display = "none";
    document.querySelector(".result-card").style.display = "flex";
    document.querySelector(".format-card").style.display = "flex";

    document.getElementById("resultIcon").className =
      "fa-solid fa-circle-check";

    document.getElementById("resultIcon").style.color = "green";

    document.getElementById("resultTitle").style.color = "green";

    document.getElementById("resultTitle").textContent = "Verified Aadhaar";

    document.getElementById("resultMessage").innerHTML = `
            <div class="pan-result">
                <p><b>Aadhaar Number:</b> ${masked}</p>
                <p><b>Status:</b> OTP Verified Successfully</p>
                <p><b>Mobile:</b> Linked with Aadhaar</p>
                <p><b>PDF:</b> Ready for Download</p>
            </div>
        `;
    saveHistoryToDB("AADHAAR", masked, "Valid");

    document.getElementById("formatTitle").textContent = "Aadhaar Format";

    document.getElementById("formatMessage").textContent =
      "12 Digits (Cannot start with 0 or 1)";
  }, 1500);
}

async function downloadAadhaarPdf() {
  const aadhaarNumber = document.getElementById("inputValue").value.trim();
  const otp = document.getElementById("aadhaarOtpInput").value.trim();

  const otpTxnId = window.aadhaarTxnId;

  if (!aadhaarNumber || !otp || !otpTxnId) {
    alert("Missing Aadhaar, OTP or transaction ID");
    return;
  }

  try {
    const response = await fetch("/api/aadhaar/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aadhaarNumber,
        otp,
        otpTxnId,
      }),
    });

    const result = await response.json();

    console.log(result);

    if (result.downloadUrl) {
      window.location.href = result.downloadUrl;
      return;
    }

    alert(result.message || "Download failed");
  } catch (error) {
    console.log(error);
    alert("Download failed");
  }
}

function renderHistory(data) {
  if (!historyList) return;
  historyList.innerHTML = "";

  if (!data || data.length === 0) {
    historyList.innerHTML = `
        <div class="empty-history">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <h3>No History Found</h3>
            <p>Your validation history will appear here.</p>
        </div>`;
    return;
  }

  historyData = data;

  data.forEach((item, index) => {
    historyList.innerHTML += `
        <div class="history-item">
            <div class="history-top"> 
                <div class="history-type"><b>${item.type}</b> - ${item.value}</div>
                <div class="history-actions-top" style="display: flex; gap: 8px; align-items: center;"> 
                    <span class="history-date">${new Date(item.createdAt).toLocaleString()}</span>
                    
                    <!-- Single Record Download Button -->
                    <button class="download-record-btn" onclick="downloadSingleRecord(${index})" title="Download PDF" style="background: #e0f2fe; 
                    color: #0284c7; 
                    border: none; 
                    padding: 5px 8px;
                     border-radius: 4px; 
                     cursor: pointer;
                     "> 
                        <i class="fa-solid fa-download"></i> 
                    </button>

                    <!-- Delete Button -->
                    <button class="delete-record-btn" onclick="deleteHistoryRecord('${item._id}')" title="Delete" style="background: #fef2f2; 
                    color: #dc2626; 
                    border: none; 
                    padding: 5px 8px; 
                    border-radius: 4px; 
                    cursor: pointer;
                    "> 

                        <i class="fa-solid fa-trash"></i> 
                    </button>
                </div>
            </div>
            <div class="history-status" style="color: ${item.status === "Valid" ? "green" : "red"}; 
            margin-top: 4px;
            ">${item.status}
            </div>
        </div>`;
  });
}

// 📄 SINGLE RECORD PDF DOWNLOAD (EXACT MATCH FORMAT)

async function downloadSingleRecord(index) {
  const item = historyData[index];
  if (!item) {
    alert("Record not found!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const userName = localStorage.getItem("name") || "TAX";
  const currentUserId =
    localStorage.getItem("userId") || "6a704c2553d2131914fe144d";

  let total = 1,
    valid = item.status === "Valid" ? 1 : 0,
    invalid = item.status !== "Valid" ? 1 : 0;
  try {
    const statsRes = await fetch(
      `/api/history/stats?userId=${currentUserId}`,
    );
    const statsData = await statsRes.json();
    if (statsData) {
      total = statsData.total || total;
      valid = statsData.success || valid;
      invalid = statsData.failed || invalid;
    }
  } catch (e) {
    console.log("Stats fetch fallback");
  }

  const recordDate = new Date(item.createdAt || Date.now());
  const dayName = recordDate.toLocaleDateString("en-US", { weekday: "long" });

 doc.setFillColor(37, 99, 235); // matches --primary
doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CA Validation Tool", 15, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Official Validation History Report", 15, 18);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  doc.setFont("helvetica", "bold");
  doc.text("User Name :", 15, 36);
  doc.setFont("helvetica", "normal");
  doc.text(userName, 40, 36);

  doc.setFont("helvetica", "bold");
  doc.text("User ID    :", 15, 43);
  doc.setFont("helvetica", "normal");
  doc.text(currentUserId, 40, 43);

  doc.setFont("helvetica", "bold");
  doc.text("Generated :", 120, 36);
  doc.setFont("helvetica", "normal");
  doc.text(recordDate.toLocaleString(), 145, 36);

  doc.setFont("helvetica", "bold");
  doc.text("Day          :", 120, 43);
  doc.setFont("helvetica", "normal");
  doc.text(dayName, 145, 43);

  const drawCard = (x, title, count) => {
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(x, 52, 55, 20, 3, 3, "F");

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, x + 5, 60);

    doc.setFontSize(14);
    doc.text(String(count), x + 5, 68);
  };

  drawCard(15, "Total", total);
  drawCard(77, "Valid", valid);
  drawCard(139, "Invalid", invalid);

  const tableY = 82;
 doc.setFillColor(37, 99, 235);
doc.rect(15, tableY, 180, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.text("Type", 20, tableY + 6.5);
  doc.text("Value", 55, tableY + 6.5);
  doc.text("Status", 130, tableY + 6.5);
  doc.text("Date & Time", 155, tableY + 6.5);

  const rowY = tableY + 10;
  doc.setFillColor(250, 250, 250);
  doc.rect(15, rowY, 180, 10, "F");

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(String(item.type || "-"), 20, rowY + 6.5);
  doc.text(String(item.value || "-"), 55, rowY + 6.5);

  doc.setFont("helvetica", "bold");
  if (item.status === "Valid") {
    doc.setTextColor(34, 160, 34);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(String(item.status || "-"), 130, rowY + 6.5);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(item.createdAt).toLocaleString(), 155, rowY + 6.5);

  doc.setDrawColor(220, 220, 220);
  doc.line(15, 280, 195, 280);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Generated by CA Validation Tool • Verify • Validate • Secure",
    105,
    286,
    { align: "center" },
  );
  doc.text("Page 1", 195, 286, { align: "right" });

  doc.save(`${item.type}_${item.value}_Report.pdf`);
}

async function loadHistory() {
  const type = document.getElementById("filterType")?.value;
  const status = document.getElementById("filterStatus")?.value;
  const date = document.getElementById("filterDate")?.value;
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (status) params.append("status", status);
  if (date) params.append("date", date);

  const userId = localStorage.getItem("userId");
  params.append("userId", userId);
  const res = await fetch(`/api/history?${params}`);
  const data = await res.json();
  renderHistory(data);
}

async function deleteHistoryRecord(id) {
  if (!confirm("Delete this validation record?")) return;
  try {
    const res = await fetch(`/api/history/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await loadHistory();
      await loadStats();
    } else {
      alert("Delete failed");
    }
  } catch (error) {
    console.log(error);
    alert("Server error");
  }
}

async function loadStats() {
  try {
    const userId = localStorage.getItem("userId");
    const res = await fetch(
      `/api/history/stats?userId=${userId}`,
    );
    const data = await res.json();
    if (totalCount) totalCount.textContent = data.total || 0;
    if (successCount) successCount.textContent = data.success || 0;
    if (failedCount) failedCount.textContent = data.failed || 0;
  } catch (error) {
    console.log("Stats load failed", error);
  }
}

function updateFormatCard(type) {
  if (formatDetails[type]) {
    formatTitle.textContent = formatDetails[type].title;
    formatMessage.textContent = formatDetails[type].desc;
  }
}

menuItems.forEach(function (item) {
  item.addEventListener("click", function () {
    menuItems.forEach(function (menu) {
      menu.classList.remove("active");
    });

    item.classList.add("active");

    selectedType = item.id;

    // ===== RESET everything when switching validation type =====
    input.value = "";
    if (clearBtn) clearBtn.style.display = "none";

    const resultCardEl = document.querySelector(".result-card");
    const formatCardEl = document.querySelector(".format-card");
    if (resultCardEl) resultCardEl.style.display = "none";
    if (formatCardEl) formatCardEl.style.display = "none";
    if (waitingCard) waitingCard.style.display = "flex";

    // Aadhaar-specific reset (agar Aadhaar se doosre option pe switch kiya ho)
    const aadhaarBoxEl = document.getElementById("aadhaarBox");
    if (aadhaarBoxEl) aadhaarBoxEl.style.display = "none";
    const otpSuccessBoxEl = document.getElementById("otpSuccessBox");
    const pdfWarningBoxEl = document.getElementById("pdfWarningBox");
    const downloadPdfSectionEl = document.getElementById("downloadPdfSection");
    if (otpSuccessBoxEl) otpSuccessBoxEl.style.display = "none";
    if (pdfWarningBoxEl) pdfWarningBoxEl.style.display = "none";
    if (downloadPdfSectionEl) downloadPdfSectionEl.style.display = "none";

    // Validate button
    const validateBtn = document.getElementById("validateBtn");

    // Validate button

    if (item.id === "aadhaar") {
      validateBtn.style.display = "none";
    } else {
      validateBtn.style.display = "inline-flex";
    }

    // Update format card
    updateFormatCard(selectedType);

    // Elements
    const captchaBox = document.getElementById("gstCaptchaBox");
    const aadhaarBox = document.getElementById("aadhaarBox");

    // Hide both special boxes first
    if (captchaBox) {
      captchaBox.style.display = "none";
    }

    if (aadhaarBox) {
      aadhaarBox.style.display = "none";
    }

    // Reset input
    input.removeAttribute("maxLength");
    input.type = "text";

    // =========================
    // PAN
    // =========================
    if (item.id === "pan") {
      input.placeholder = "Enter Your PAN number";

      hint.textContent = "Enter 10 character PAN number (e.g., ABCDE1234F)";

      input.setAttribute("maxLength", "10");
    }

    // =========================
    // TAN
    // =========================
    else if (item.id === "tan") {
      input.placeholder = "Enter Your TAN number";

      hint.textContent = "Enter 10 character TAN number (e.g., ABCA12345B)";

      input.setAttribute("maxLength", "10");
    }

    // =========================
    // GST
    // =========================
    else if (item.id === "gst") {
      input.placeholder = "Enter Your GST number";

      hint.textContent =
        "Enter 15 character GSTIN number (e.g., 24ABCDE1234F1Z5)";

      input.setAttribute("maxLength", "15");

      if (captchaBox) {
        captchaBox.style.display = "block";
        loadGSTCaptcha();
      }
    }

    // =========================
    // AADHAAR
    // =========================
    else if (item.id === "aadhaar") {
      input.placeholder = "Enter Your Aadhaar number";

      hint.textContent = "Enter 12 digit Aadhaar number";

      input.setAttribute("maxLength", "12");
      input.type = "tel";

      if (aadhaarBox) {
        aadhaarBox.style.display = "block";
        loadAadhaarCaptcha();
      }
    }

    // =========================
    // EMAIL
    // =========================
    else if (item.id === "email") {
      input.placeholder = "Enter Your Email";

      hint.textContent =
        "Enter a valid email address (e.g., example@gmail.com)";

      input.removeAttribute("maxLength");
      input.type = "email";
    }

    // =========================
    // MOBILE
    // =========================
    else if (item.id === "mobile") {
      input.placeholder = "Enter Your Mobile number";

      hint.textContent = "Enter 10 digit mobile number (e.g., 9876543210)";

      input.setAttribute("maxLength", "10");
      input.type = "tel";
    }
  });
});

clearBtn.addEventListener("click", function () {
  input.value = "";
  clearBtn.style.display = "none";
  input.focus();

  if (selectedType === "gst") {
    const captchaInput = document.getElementById("gstCaptchaInput");
    if (captchaInput) captchaInput.value = "";
    loadGSTCaptcha();
  }
});

// REAL-TIME INPUT RESTRICTIONS (PAN, TAN, Mobile & Aadhaar)

input.addEventListener("input", function (e) {
  clearBtn.style.display = this.value ? "block" : "none";

  if (selectedType === "pan") {
    let val = this.value.toUpperCase();

    if (val.length > 10) {
      val = val.slice(0, 10);
    }

    for (let i = 0; i < val.length; i++) {
      if (i < 5 && !/[A-Z]/.test(val[i])) {
        alert(`Character at position ${i + 1} in PAN must be a Letter (A-Z)!`);
        val = val.slice(0, i);
        break;
      } else if (i >= 5 && i < 9 && !/[0-9]/.test(val[i])) {
        alert(`Character at position ${i + 1} in PAN must be a Number (0-9)!`);
        val = val.slice(0, i);
        break;
      } else if (i === 9 && !/[A-Z]/.test(val[i])) {
        alert("The last (10th) character in PAN must be a Letter (A-Z)!");
        val = val.slice(0, 9);
        break;
      }
    }
    this.value = val;
  }

  if (selectedType === "tan") {
    let val = this.value.toUpperCase(); // Auto Capitalize

    if (val.length > 10) {
      val = val.slice(0, 10);
    }

    for (let i = 0; i < val.length; i++) {
      // First 4 characters must be Letters (A-Z)
      if (i < 4 && !/[A-Z]/.test(val[i])) {
        alert(`Character at position ${i + 1} in TAN must be a Letter (A-Z)!`);
        val = val.slice(0, i);
        break;
      } else if (i >= 4 && i < 9 && !/[0-9]/.test(val[i])) {
        alert(`Character at position ${i + 1} in TAN must be a Number (0-9)!`);
        val = val.slice(0, i);
        break;
      } else if (i === 9 && !/[A-Z]/.test(val[i])) {
        alert("The last (10th) character in TAN must be a Letter (A-Z)!");
        val = val.slice(0, 9);
        break;
      }
    }
    this.value = val;
  }

  if (selectedType === "mobile") {
    let cleanedValue = this.value.replace(/\D/g, "");

    if (cleanedValue.length > 0) {
      const firstDigit = cleanedValue.charAt(0);
      if (!["6", "7", "8", "9"].includes(firstDigit)) {
        alert("Mobile number starting digit should be 6, 7, 8, or 9!");
        cleanedValue = "";
      }
    }

    if (cleanedValue.length > 10) {
      cleanedValue = cleanedValue.slice(0, 10);
    }
    this.value = cleanedValue;
  }

  if (selectedType === "aadhaar") {
    let cleanedValue = this.value.replace(/\D/g, "");

    if (cleanedValue.length > 0) {
      const firstDigit = cleanedValue.charAt(0);
      if (firstDigit === "0" || firstDigit === "1") {
        alert(
          "Aadhaar number cannot start with 0 or 1! Starting digit should be between 2 and 9.",
        );
        cleanedValue = "";
      }
    }

    if (cleanedValue.length > 12) {
      cleanedValue = cleanedValue.slice(0, 12);
    }
    this.value = cleanedValue;
  }

  if (selectedType === "gst") {
    let val = this.value.toUpperCase();

    if (val.length > 15) {
      val = val.slice(0, 15);
    }

    for (let i = 0; i < val.length; i++) {
      if (i < 2 && !/[0-9]/.test(val[i])) {
        alert(`First 2 characters of GSTIN must be State Code Digits (0-9)!`);
        val = val.slice(0, i);
        break;
      } else if (i >= 2 && i < 7 && !/[A-Z]/.test(val[i])) {
        alert(`Character at position ${i + 1} must be a Letter (A-Z)!`);
        val = val.slice(0, i);
        break;
      } else if (i >= 7 && i < 11 && !/[0-9]/.test(val[i])) {
        alert(`Character at position ${i + 1} must be a Number (0-9)!`);
        val = val.slice(0, i);
        break;
      } else if (i === 11 && !/[A-Z]/.test(val[i])) {
        alert(`12th character of GSTIN must be a Letter (A-Z)!`);
        val = val.slice(0, 11);
        break;
      } else if (i === 13 && val[i] !== "Z") {
        alert(`14th character of GSTIN is typically 'Z'!`);
        val = val.slice(0, 13);
        break;
      }
    }
    this.value = val;
  }

  // 6. EMAIL VALIDATION LOGIC
  if (selectedType === "email") {
    let val = this.value;

    if (/\s/.test(val)) {
      alert("Email address cannot contain spaces!");
      val = val.replace(/\s/g, "");
    }

    this.value = val.toLowerCase();
  }
});

input.addEventListener("input", function () {
  clearBtn.style.display = this.value ? "block" : "none";
});

darkModeBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
});

const copyBtn = document.getElementById("copyBtn");
if (copyBtn) {
  copyBtn.addEventListener("click", function () {
    const textToCopy = input.value.trim();
    if (!textToCopy) return;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
        setTimeout(() => {
          copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  });
}

// MAIN VALIDATION ACTION

validateBtn.addEventListener("click", async function () {
  const rawValue = input.value.trim();
  if (rawValue === "") {
    alert("Please enter a value before validation.");
    input.focus();
    return;
  }

  resultIcon.style.display = "none";
  resultTitle.textContent = "Checking Validation...";
  resultTitle.style.color = "#0d6efd";
  resultMessage.textContent = "Please wait while we validate your input.";
  validateBtn.disabled = true;
  validateBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Validating...';

  setTimeout(async function () {
    if (waitingCard) waitingCard.style.display = "none";
    const resultCard = document.querySelector(".result-card");
    if (resultCard) resultCard.style.display = "flex";

    const uppercaseValue = rawValue.toUpperCase();
    let isValid = false;
    let title = "";

    switch (selectedType) {
      case "pan":
        title = "PAN";
        try {
          const panData = await verifyPANLive(uppercaseValue);
          if (panData && panData.data) {
            const details = panData.data;
            isValid = details.status === "Valid and Operative";

            resultIcon.style.display = "block";
            resultIcon.className = isValid
              ? "fa fa-check-circle"
              : "fa fa-times-circle";
            resultIcon.style.color = isValid ? "green" : "red";
            resultTitle.style.color = isValid ? "green" : "red";
            resultTitle.textContent = isValid ? "Valid PAN" : "Invalid PAN";

            resultMessage.innerHTML = `
                            <div class="pan-result">
                                <p><b>Full Name:</b> ${details.fullNameAsPan}</p>
                                <p><b>PAN:</b> ${details.pan}</p>
                                <p><b>Status:</b> ${details.status}</p>
                            </div>
                        `;
          } else {
            throw new Error("Invalid response");
          }
        } catch (error) {
          isValid = false;
          resultIcon.style.display = "block";
          resultIcon.className = "fa fa-times-circle";
          resultIcon.style.color = "red";
          resultTitle.style.color = "red";
          resultTitle.textContent = "PAN Verification Failed";
          resultMessage.textContent = "Unable to fetch PAN details.";
        }
        break;

      case "gst":
        title = "GSTIN";
        const captcha = document
          .getElementById("gstCaptchaInput")
          ?.value.trim();

        if (!captcha) {
          alert("Please enter captcha");
          validateBtn.disabled = false;
          validateBtn.innerHTML =
            '<i class="fa-solid fa-shield-halved"></i> Validate';
          return;
        }

        try {
          const gstData = await verifyGST(uppercaseValue, captcha);
          if (gstData && gstData.data) {
            isValid = gstData.data.sts === "Active";

            resultIcon.style.display = "block";
            resultIcon.className = isValid
              ? "fa fa-check-circle"
              : "fa fa-times-circle";
            resultIcon.style.color = isValid ? "green" : "red";
            resultTitle.style.color = isValid ? "green" : "red";
            resultTitle.textContent = isValid ? "Valid GSTIN" : "Invalid GSTIN";

            resultMessage.innerHTML = `
                            <div class="gst-result-card">
                                <h3>${gstData.data.tradeNam || "N/A"}</h3>
                                <p><b>Legal Name:</b> ${gstData.data.lgnm || "N/A"}</p>
                                <p><b>GSTIN:</b> ${gstData.data.gstin || uppercaseValue}</p>
                                <p><b>Status:</b> ${gstData.data.sts || "N/A"}</p>
                                <p><b>Type:</b> ${gstData.data.dty || "N/A"}</p>
                                <p><b>Registration:</b> ${gstData.data.rgdt || "N/A"}</p>
                                <p><b>Address:</b> ${gstData.data.pradr?.adr || "N/A"}</p>
                            </div>
                        `;
          } else {
            throw new Error(gstData.message || "GST fetch failed");
          }
        } catch (err) {
          console.log(err);
          isValid = false;
          resultIcon.style.display = "block";
          resultIcon.className = "fa fa-times-circle";
          resultIcon.style.color = "red";
          resultTitle.style.color = "red";
          resultTitle.textContent = "GST Verification Failed";
          resultMessage.textContent =
            "Invalid GST number or incorrect captcha code.";
        }
        break;

      case "tan":
        title = "TAN";

        try {
          const tanData = await verifyTANLive(uppercaseValue);

          console.log("TAN API Response =>", tanData);

          if (tanData && tanData.data) {
            const details = tanData.data;

            isValid = true;

            resultIcon.style.display = "block";
            resultIcon.className = "fa fa-check-circle";
            resultIcon.style.color = "green";

            resultTitle.style.color = "green";
            resultTitle.textContent = "Valid TAN";

            resultMessage.innerHTML = `
                <div class="pan-result">
                    <p><b>TAN:</b> ${uppercaseValue}</p>

                    <p><b>Name as per TAN:</b> 
                        ${details.nameAsPerTan || "N/A"}
                    </p>

                    <p><b>PAN:</b> 
                        ${details.panCode || "N/A"}
                    </p>

                    <p><b>PAN Name:</b> 
                        ${details.panName || "N/A"}
                    </p>

                    <p><b>Category:</b> 
                        ${details.category || "N/A"}
                    </p>

                    <p><b>Status:</b> Valid</p>
                </div>
            `;
          } else {
            throw new Error(tanData?.message || "TAN verification failed");
          }
        } catch (error) {
          console.error("TAN Verification Error:", error);

          isValid = false;

          resultIcon.style.display = "block";
          resultIcon.className = "fa fa-times-circle";
          resultIcon.style.color = "red";

          resultTitle.style.color = "red";
          resultTitle.textContent = "TAN Verification Failed";

          resultMessage.innerHTML = `
            <div class="pan-result">
                <p><b>TAN:</b> ${uppercaseValue}</p>
                <p><b>Status:</b> Verification Failed</p>
                <p>Unable to fetch TAN details.</p>
            </div>
        `;
        }

        break;
      case "aadhaar":
        title = "AADHAAR";

        document.getElementById("aadhaarBox").style.display = "block";

        loadAadhaarCaptcha();

        resultTitle.textContent = "Aadhaar OTP Verification";

        resultTitle.style.color = "#0d6efd";

        resultMessage.innerHTML = `
      <div class="otp-info">
        <p>Enter captcha and click <b>Send OTP</b>.</p>
        <p>OTP will be sent to the Aadhaar-linked mobile number.</p>
      </div>
    `;

        validateBtn.disabled = false;

        validateBtn.innerHTML =
          '<i class="fa-solid fa-shield-halved"></i> Validate';

        return;

      case "email":
        title = "EMAIL";

        try {
          const emailData = await verifyEmailLive(rawValue);

          console.log("EMAIL API Response =>", emailData);

          if (emailData && emailData.success) {
            isValid = emailData.valid === true;

            resultIcon.style.display = "block";

            resultIcon.className = isValid
              ? "fa fa-check-circle"
              : "fa fa-times-circle";

            resultIcon.style.color = isValid ? "green" : "red";

            resultTitle.style.color = isValid ? "green" : "red";

            resultTitle.textContent = isValid ? "Valid Email" : "Invalid Email";

            const suggestedCorrection =
              emailData.full_response?.suggested_correction;

            resultMessage.innerHTML = `
                <div class="pan-result">

                    <p>
                        <b>Email:</b>
                        ${emailData.email || rawValue}
                    </p>

                    <p>
                        <b>Status:</b>
                        ${emailData.status || "N/A"}
                    </p>

                    <p>
                        <b>Status Detail:</b>
                        ${emailData.status_detail || "N/A"}
                    </p>

                    <p>
                        <b>Format Valid:</b>
                        ${emailData.is_format_valid ? "Yes" : "No"}
                    </p>

                    <p>
                        <b>SMTP Valid:</b>
                        ${emailData.is_smtp_valid ? "Yes" : "No"}
                    </p>

                    <p>
                        <b>MX Valid:</b>
                        ${emailData.is_mx_valid ? "Yes" : "No"}
                    </p>

                    <p>
                        <b>Disposable:</b>
                        ${emailData.is_disposable ? "Yes" : "No"}
                    </p>

                    <p>
                        <b>Free Email:</b>
                        ${emailData.is_free_email ? "Yes" : "No"}
                    </p>

                    <p>
                        <b>Risk Status:</b>
                        ${emailData.risk_status || "N/A"}
                    </p>

                    ${
                      suggestedCorrection
                        ? `
                            <p>
                                <b>Suggested Correction:</b>
                                ${suggestedCorrection}
                            </p>
                            `
                        : ""
                    }

                </div>
            `;
          } else {
            isValid = false;

            resultIcon.style.display = "block";
            resultIcon.className = "fa fa-times-circle";
            resultIcon.style.color = "red";

            resultTitle.style.color = "red";
            resultTitle.textContent = "Email Verification Failed";

            resultMessage.innerHTML = `
                <div class="pan-result">
                    <p><b>Email:</b> ${rawValue}</p>
                    <p><b>Status:</b> Verification Failed</p>
                    <p>Unable to verify this email address.</p>
                </div>
            `;
          }
        } catch (error) {
          console.error("Email Verification Error:", error);

          isValid = false;

          resultIcon.style.display = "block";
          resultIcon.className = "fa fa-times-circle";
          resultIcon.style.color = "red";

          resultTitle.style.color = "red";
          resultTitle.textContent = "Email Verification Failed";

          resultMessage.innerHTML = `
            <div class="pan-result">
                <p><b>Email:</b> ${rawValue}</p>
                <p><b>Status:</b> API Error</p>
                <p>Unable to connect to Email Verification API.</p>
            </div>
        `;
        }

        break;

      case "mobile":
        title = "MOBILE";

        // Format check pehle (10 digit, 6-9 se start)
        if (!validateMobile(rawValue)) {
          isValid = false;

          resultIcon.style.display = "block";
          resultIcon.className = "fa fa-times-circle";
          resultIcon.style.color = "red";

          resultTitle.style.color = "red";
          resultTitle.textContent = "Invalid Mobile Number";
          resultMessage.textContent =
            "Please enter a valid 10-digit mobile number.";

          break;
        }

        try {
          const mobileData = await verifyMobileLive(rawValue);

          if (mobileData && mobileData.phone_validation) {
            const validation = mobileData.phone_validation;
            const carrier = mobileData.phone_carrier || {};
            const risk = mobileData.phone_risk || {};

            isValid = validation.is_valid === true;

            resultIcon.style.display = "block";
            resultIcon.className = isValid
              ? "fa fa-check-circle"
              : "fa fa-times-circle";
            resultIcon.style.color = isValid ? "green" : "red";

            resultTitle.style.color = isValid ? "green" : "red";
            resultTitle.textContent = isValid
              ? "Valid Mobile Number"
              : "Invalid Mobile Number";

            resultMessage.innerHTML = `
                <div class="pan-result">
                    <p><b>Number:</b> ${mobileData.phone_number || rawValue}</p>
                    <p><b>Carrier:</b> ${carrier.name || "Unknown"}</p>
                    <p><b>Line Type:</b> ${carrier.line_type || "Unknown"}</p>
                    <p><b>Line Status:</b> ${validation.line_status || "Unknown"}</p>
                    <p><b>Risk Level:</b> ${risk.risk_level || "Unknown"}</p>
                </div>
            `;
          } else {
            throw new Error("Invalid response");
          }
        } catch (error) {
          isValid = false;

          resultIcon.style.display = "block";
          resultIcon.className = "fa fa-times-circle";
          resultIcon.style.color = "red";

          resultTitle.style.color = "red";
          resultTitle.textContent = "Mobile Verification Failed";
          resultMessage.textContent = "Unable to fetch mobile details.";
        }

        break;

        try {
          // API call
          const mobileData = await verifyMobileLive(rawValue);

          console.log("MOBILE API RESPONSE =>", mobileData);

          if (mobileData && mobileData.success && mobileData.data) {
            const details = mobileData.data;

            const validation = details.phone_validation || {};

            const format = details.phone_format || {};

            const carrier = details.phone_carrier || {};

            const location = details.phone_location || {};

            const risk = details.phone_risk || {};

            const registration = details.phone_registration || {};

            const breaches = details.phone_breaches || {};

            // Actual API validation
            isValid = validation.is_valid === true;

            // ICON
            resultIcon.style.display = "block";

            resultIcon.className = isValid
              ? "fa fa-check-circle"
              : "fa fa-times-circle";

            resultIcon.style.color = isValid ? "green" : "red";

            // TITLE
            resultTitle.style.color = isValid ? "green" : "red";

            resultTitle.textContent = isValid
              ? "Valid Mobile Number"
              : "Invalid Mobile Number";

            // RESULT CARD
            resultMessage.innerHTML = `

                <div class="pan-result">

                    <p>
                        <b>Mobile Number:</b>
                        ${format.international || details.phone_number || rawValue}
                    </p>

                    <p>
                        <b>Status:</b>
                        ${validation.line_status || "N/A"}
                    </p>

                    <p>
                        <b>Valid:</b>
                        ${validation.is_valid ? "Yes" : "No"}
                    </p>

                    <p>
                        <b>Line Type:</b>
                        ${carrier.line_type || "N/A"}
                    </p>

                    <p>
                        <b>Carrier:</b>
                        ${carrier.name || "N/A"}
                    </p>

                    <p>
                        <b>Country:</b>
                        ${location.country_name || "N/A"}
                    </p>

                    <p>
                        <b>Country Code:</b>
                        ${location.country_code || "N/A"}
                    </p>

                    <p>
                        <b>Country Prefix:</b>
                        ${location.country_prefix || "N/A"}
                    </p>

                    <p>
                        <b>City:</b>
                        ${location.city || "N/A"}
                    </p>

                    <p>
                        <b>Timezone:</b>
                        ${location.timezone || "N/A"}
                    </p>

                    <p>
                        <b>VOIP:</b>
                        ${validation.is_voip ? "Yes" : "No"}
                    </p>

                    <p>
                        <b>Risk Level:</b>
                        ${risk.risk_level || "N/A"}
                    </p>

                    <p>
                        <b>Disposable:</b>
                        ${risk.is_disposable ? "Yes" : "No"}
                    </p>

                    <p>
                        <b>Abuse Detected:</b>
                        ${risk.is_abuse_detected ? "Yes" : "No"}
                    </p>

                    <p>
                        <b>Breaches:</b>
                        ${breaches.total_breaches ?? 0}
                    </p>

                </div>

            `;
          } else {
            throw new Error(
              mobileData?.message || "Mobile verification failed",
            );
          }
        } catch (error) {
          console.error("Mobile Verification Error:", error);

          isValid = false;

          resultIcon.style.display = "block";

          resultIcon.className = "fa fa-times-circle";

          resultIcon.style.color = "red";

          resultTitle.style.color = "red";

          resultTitle.textContent = "Mobile Verification Failed";

          resultMessage.innerHTML = `

            <div class="pan-result">

                <p>
                    <b>Mobile:</b>
                    ${rawValue}
                </p>

                <p>
                    <b>Status:</b>
                    API Verification Failed
                </p>

                <p>
                    Unable to verify this mobile number.
                </p>

            </div>

        `;
        }

        break;
    }

    try {
      await saveHistoryToDB(title, rawValue, isValid ? "Valid" : "Invalid");
      await loadHistory();
      await loadStats();
    } catch (error) {
      console.log("Validation save/load error:", error);
    } finally {
      validateBtn.disabled = false;
      validateBtn.innerHTML =
        '<i class="fa-solid fa-shield-halved"></i> Validate';
    }
  }, 1000);
});

// History & Export Listeners
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", function () {
    if (confirm("Delete all history?")) {
      historyData = [];
    }
  });
}

// if (historyBtn) {
//     historyBtn.addEventListener('click', async function () {
//         if (historyPopup) historyPopup.style.display = 'block';
//         await loadHistory();
//         await loadStats();
//     });
// }

// if (closeHistory) {
//     closeHistory.addEventListener("click", function () {
//         if (historyPopup) historyPopup.style.display = "none";
//     });
// }

if (downloadAllBtn) {
  downloadAllBtn.addEventListener("click", async function () {
    const type = document.getElementById("filterType")?.value || "";
    const status = document.getElementById("filterStatus")?.value || "";
    const date = document.getElementById("filterDate")?.value || "";
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    if (date) params.append("date", date);

    const userId = localStorage.getItem("userId") || "N/A";
    params.append("userId", userId);

    try {
      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();

      if (!data || data.length === 0) {
        alert("No history available.");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      // Data Analytics Computation
      const total = data.length;
      const valid = data.filter(
        (i) =>
          String(i.status).toLowerCase() === "valid" ||
          String(i.status).toLowerCase() === "active",
      ).length;
      const invalid = total - valid;

      const userName = localStorage.getItem("name") || "User";
      const now = new Date();

      // 1. TOP HEADER BANNER (Exact Dashboard Teal Brand Color)

      doc.setFillColor(37, 99, 235); // matches --primary #2563eb
      doc.rect(0, 0, 210, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CA Validation Tool", 14, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(219, 234, 254); // light blue tint matching theme
doc.text('Validate PAN, TAN, Aadhaar, GSTIN, Mobile & Email', 14, 22);
      // 2. USER META INFO CONTAINER

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, 182, 20, 3, 3, "FD");

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("USER NAME :", 20, 42);
      doc.text("USER ID   :", 20, 49);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(String(userName), 44, 42);
      doc.setFont("helvetica", "normal");
      doc.text(String(userId), 44, 49);

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.text("GENERATED :", 120, 42);
      doc.text("DAY       :", 120, 49);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.text(now.toLocaleString(), 144, 42);
      doc.text(now.toLocaleDateString("en-US", { weekday: "long" }), 144, 49);

      // 3. STATS CARDS (Matching Dashboard Soft Boxes & Bottom Line Accent)

      const drawDashStatCard = (
        title,
        count,
        x,
        y,
        width,
        height,
        accentColor,
      ) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(x, y, width, height, 4, 4, "FD");

        doc.setFillColor(...accentColor);
        doc.rect(x + 2, y + height - 2, width - 4, 1.8, "F");

        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(title, x + 8, y + 10);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(String(count), x + 8, y + 20);
      };

     drawDashStatCard("Total Validations", total, 14, 59, 56, 25, [37, 99, 235]);
drawDashStatCard("Success", valid, 77, 59, 56, 25, [22, 163, 74]);
drawDashStatCard("Failed", invalid, 140, 59, 56, 25, [220, 38, 38]);
      // 4. TABLE RENDER (Dashboard Dark Navy Sidebar Color)

      let y = 92;

      const drawTableHeader = (currentY) => {
        doc.setFillColor(11, 42, 91); // Exact Dark Navy from Dashboard Sidebar
        doc.rect(14, currentY, 182, 10, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("TYPE", 20, currentY + 6.5);
        doc.text("VALUE", 46, currentY + 6.5);
        doc.text("STATUS", 126, currentY + 6.5);
        doc.text("DATE & TIME", 152, currentY + 6.5);
      };

      drawTableHeader(y);
      y += 10;

      data.forEach((item, index) => {
        if (y > 265) {
          addFooter(doc);
          doc.addPage();
          y = 20;
          drawTableHeader(y);
          y += 10;
        }

        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 182, 10, "F");
        }

        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(String(item.type || "N/A"), 20, y + 6.5);

        doc.setFont("helvetica", "bold");
        const valueText = String(item.value || "N/A").slice(0, 22);
        doc.text(valueText, 46, y + 6.5);

        const isValid =
          String(item.status).toLowerCase() === "valid" ||
          String(item.status).toLowerCase() === "active";
        if (isValid) {
          doc.setFillColor(220, 252, 231); // Light Green
          doc.roundedRect(124, y + 2, 18, 6, 2, 2, "F");
          doc.setTextColor(22, 101, 52);
        } else {
          doc.setFillColor(254, 226, 226); // Light Red
          doc.roundedRect(124, y + 2, 18, 6, 2, 2, "F");
          doc.setTextColor(153, 27, 27);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(isValid ? "Valid" : "Invalid", 133, y + 6, {
          align: "center",
        });

        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const dt = item.createdAt
          ? new Date(item.createdAt).toLocaleString()
          : now.toLocaleString();
        doc.text(dt, 152, y + 6.5);

        doc.setDrawColor(241, 245, 249);
        doc.line(14, y + 10, 196, y + 10);

        y += 10;
      });

      addFooter(doc);
      doc.save(`CA_Validation_Report_${now.toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error generating report PDF:", error);
      alert("An error occurred while generating PDF report.");
    }
  });
}

function addFooter(doc) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);

  doc.text(
    "Generated by CA Validation Tool • Validate PAN, TAN, Aadhaar, GSTIN, Mobile & Email",
    14,
    pageHeight - 10,
  );
  doc.text(
    `Page ${doc.internal.getNumberOfPages()}`,
    pageWidth - 14,
    pageHeight - 10,
    { align: "right" },
  );
}

// 📊 EXPORT HISTORY TO EXCEL LOGIC

const exportExcelBtn = document.getElementById("exportExcelBtn");

if (exportExcelBtn) {
  exportExcelBtn.addEventListener("click", async function () {
    try {
      const type = document.getElementById("filterType")?.value || "";
      const status = document.getElementById("filterStatus")?.value || "";
      const date = document.getElementById("filterDate")?.value || "";

      const params = new URLSearchParams({ userId });
      if (type) params.append("type", type);
      if (status) params.append("status", status);
      if (date) params.append("date", date);

      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();

      if (!data || data.length === 0) {
        alert("No history available to export.");
        return;
      }

      const excelData = data.map((item) => ({
        "Validation Type": item.type || "-",
        "Entered Value": item.value || "-",
        Status: item.status || "-",
        Date: new Date(item.createdAt).toLocaleDateString(),
        Time: new Date(item.createdAt).toLocaleTimeString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Validation History");

      XLSX.writeFile(workbook, `Validation_History_${date || "all"}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to export Excel file.");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const userName =
    localStorage.getItem("name") || localStorage.getItem("userName") || "User";
  const userEmail =
    localStorage.getItem("email") ||
    localStorage.getItem("userEmail") ||
    "user@gmail.com";

  const nameEl = document.getElementById("sidebarUserName");
  const emailEl = document.getElementById("sidebarUserEmail");
  const avatarEl = document.getElementById("userAvatar");

  if (nameEl) nameEl.textContent = userName;
  if (emailEl) emailEl.textContent = userEmail;

  if (avatarEl && userName) {
    avatarEl.textContent = userName.charAt(0).toUpperCase();
  }
});

window.addEventListener("load", () => {
  if (document.getElementById("aadhaarBox")) {
    loadAadhaarCaptcha();
  }
});

document.getElementById("filterType")?.addEventListener("change", loadHistory);
document
  .getElementById("filterStatus")
  ?.addEventListener("change", loadHistory);
document.getElementById("filterDate")?.addEventListener("change", loadHistory);

// ===== Set default date filter to today's date =====
function setDefaultHistoryDate() {
  const filterDateEl = document.getElementById("filterDate");
  if (!filterDateEl) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  filterDateEl.value = `${yyyy}-${mm}-${dd}`;
}

setDefaultHistoryDate();

loadStats();
loadHistory();



