const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/verify', async (req, res) => {
    console.log('EMAIL VERIFY HIT');
    console.log('BODY:', req.body);

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'email is required'
            });
        }

        // Basic format check
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const response = await axios.get(
    'https://emailreputation.abstractapi.com/v1/',
    {
        params: {
            api_key: process.env.ABSTRACT_API_KEY,
            email: email
        }
    }
);

        console.log('ABSTRACT STATUS:', response.status);
        console.log('ABSTRACT DATA:', response.data);

        const data = response.data;

        const isDeliverable =
            data.email_deliverability?.status === 'deliverable' &&
            data.email_deliverability?.is_smtp_valid === true;

        return res.json({
            success: true,

            email: data.email_address,

            valid: isDeliverable,

            status: data.email_deliverability?.status || null,

            status_detail: data.email_deliverability?.status_detail || null,

            is_format_valid:
                data.email_deliverability?.is_format_valid ?? false,

            is_smtp_valid:
                data.email_deliverability?.is_smtp_valid ?? false,

            is_mx_valid:
                data.email_deliverability?.is_mx_valid ?? false,

            is_disposable:
                data.email_quality?.is_disposable ?? false,

            is_free_email:
                data.email_quality?.is_free_email ?? false,

            is_catchall:
                data.email_quality?.is_catchall ?? false,

            is_role:
                data.email_quality?.is_role ?? false,

            risk_status:
                data.email_risk?.address_risk_status || null,

            full_response: data
        });

    } catch (error) {
        console.log('EMAIL API ERROR:', error.message);

        if (error.response) {
            console.log('ABSTRACT STATUS:', error.response.status);
            console.log('ABSTRACT RESPONSE:', error.response.data);

            return res.status(error.response.status).json({
                success: false,
                message: 'Abstract Email API error',
                abstractResponse: error.response.data
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to verify email',
            error: error.message
        });
    }
});

module.exports = router;