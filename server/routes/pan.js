const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/verify', async (req, res) => {

  try {

    const { pan } = req.body;

    const response = await axios.post(
      'http://e-port-api.i-tax.in/new_traces_verify_pan',
      { pan },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.log('PAN API Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to verify PAN'
    });
  }
});

module.exports = router;