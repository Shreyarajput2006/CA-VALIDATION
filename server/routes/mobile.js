const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/verify', async (req, res) => {

  try {

    const { mobile } = req.body;

    // Agar sirf 10 digit number hai to +91 laga do
    const phone = mobile.length === 10 ? `+91${mobile}` : mobile;

    const response = await axios.get(
      'https://phoneintelligence.abstractapi.com/v1/',
      {
        params: {
          api_key: process.env.ABSTRACT_MOBILE_API_KEY,
          phone: phone
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.log('Mobile API Error:', error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to verify mobile number'
    });
  }
});

module.exports = router;