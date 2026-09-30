const express = require('express');
const axios = require('axios');
const router = express.Router();


let currentCaptchaCookie = "";


router.get('/captcha', async (req, res) => {
  try {
    const response = await axios.get(
      'https://taxfileposterapi.myeventz.in/gst_info/captcha?t=' + Date.now()
    );

    
    if (response.data && response.data.captchaCookie) {
      currentCaptchaCookie = response.data.captchaCookie;
    }

    res.json(response.data);
  } catch (error) {
    console.error("Captcha API Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch captcha" });
  }
});

//  INFO / VERIFY ROUTE
router.post('/verify', async (req, res) => {
  try {
    const { gstin, captcha } = req.body;

  
    const payload = {
      gstNumber: gstin,
      captcha: captcha,
      cookies: currentCaptchaCookie 
    };

    const response = await axios.post(
      'https://taxfileposterapi.myeventz.in/gst_info/info',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.log("GST Info API Error:", error.response?.data || error.message);

    res.status(400).json({
      success: false,
      message: error.response?.data?.message || 'Invalid GSTIN or Captcha'
    });
  }
});

module.exports = router;