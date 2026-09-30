// --- Existing Regex & Captcha Logic ---
function validateGST(value) {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    return regex.test(value);
}

let gstCaptchaCookie = ""; 

// Global Function to Load Captcha
async function loadGSTCaptcha() {
    try {
        const img = document.getElementById('gstCaptchaImg');
        if (img) img.src = '';

        const res = await fetch('/api/gst/captcha');
        const data = await res.json();

        if (img && data.captchaImage) {
            img.src = 'data:image/png;base64,' + data.captchaImage;
        }
    } catch (err) {
        console.log('Captcha load error:', err);
    }
}

// Function to Verify GST
async function verifyGST(gstin, captcha) {
    const response = await fetch('/api/gst/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            gstin: gstin, 
            captcha: captcha 
        })
    });
    
    return await response.json();
}


function renderGstResult(data, gstin) {
    const resultTitle = document.getElementById("resultTitle");
    const resultMessage = document.getElementById("resultMessage");
    const resultIcon = document.getElementById("resultIcon");

    const info = data.data || data;

    if (resultTitle) {
        resultTitle.textContent = "Valid GSTIN";
        resultTitle.style.color = "green";
    }
    if (resultIcon) {
        resultIcon.className = "fa fa-check-circle";
        resultIcon.style.color = "green";
    }

    if (resultMessage) {
        resultMessage.innerHTML = `
            <div style="margin-top: 8px; line-height: 1.6;">
                <p><strong>Legal Name:</strong> ${info.lgnm || info.legalName || 'N/A'}</p>
                <p><strong>Trade Name:</strong> ${info.tradeNam || info.tradeName || 'N/A'}</p>
                <p><strong>GSTIN:</strong> ${gstin}</p>
                <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">${info.sts || info.status || 'Active'}</span></p>
                <p><strong>Taxpayer Type:</strong> ${info.dty || info.taxpayerType || 'Regular'}</p>
            </div>
        `;
    }
}

function displayGstError(title, message) {
    const resultTitle = document.getElementById("resultTitle");
    const resultMessage = document.getElementById("resultMessage");
    const resultIcon = document.getElementById("resultIcon");

    if (resultTitle) {
        resultTitle.textContent = title;
        resultTitle.style.color = "red";
    }
    if (resultIcon) {
        resultIcon.className = "fa fa-times-circle";
        resultIcon.style.color = "red";
    }
    if (resultMessage) {
        resultMessage.textContent = message;
    }
}