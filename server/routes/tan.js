const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/verify', async (req, res) => {
    console.log('TAN VERIFY HIT');
    console.log('BODY:', req.body);

    try {
        const { tanCode } = req.body;

        if (!tanCode) {
            return res.status(400).json({
                success: false,
                message: 'tanCode is required'
            });
        }

        const response = await axios.post(
            'https://traces-app.tdscpc.gov.in/registration/deductor/register/getPanByTanCode',
            {
                tanCode: tanCode
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cookie': process.env.TRACES_COOKIE
                }
            }
        );

        console.log('TRACES STATUS:', response.status);
        console.log('TRACES DATA:', response.data);

        return res.status(response.status).json(response.data);

    } catch (error) {
        console.log('TAN API ERROR:', error.message);

        if (error.response) {
            console.log('TRACES STATUS:', error.response.status);
            console.log('TRACES RESPONSE:', error.response.data);

            return res.status(error.response.status).json({
                success: false,
                message: 'TRACES API error',
                tracesResponse: error.response.data
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to verify TAN',
            error: error.message
        });
    }
});

module.exports = router;