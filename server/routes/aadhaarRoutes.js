const express = require('express');
 const axios = require('axios'); const router = express.Router(); 
 const BASE = 'https://taxfileposterapi.myeventz.in/aadhaar'; 



 // Generate Captcha
 router.get('/captcha', async (req, res) => { 
   try { 
      const response = await axios.post(`${BASE}/generate-captcha`); 
 res.json({ 
   imageUrl: response.data.data.imageUrl, 
   transactionId: response.data.data.transactionId
 });

 } 

 catch (err) { console.log(err.response?.data || err.message); 
   res.status(500).json({ message: 'Captcha failed' 

   }); 
} 
}); 



 // Send OTP
  router.post('/send-otp', async (req, res) => { try {
    const response = await axios.post(`${BASE}/generate-otp`, req.body); 
  res.json({ 
   status: response.data.status, 
   txnId: response.data.data.txnId, 
   message: response.data.message 
});

 }
  catch (err) { 
   console.log(err.response?.data || err.message); 
    res.status(500).json({ message: 'OTP failed' }); 
} 

}); 


// Download Aadhaar PDF
   router.post('/download', async (req, res) => { try { const { aadhaarNumber, otp, otpTxnId } = req.body; 
   const response = await axios.post( `${BASE}/download`, { aadhaarNumber, otp, otpTxnId } ); console.log(response.data); 
   res.json({ 
    status: response.data.status,
     downloadUrl: response.data.downloadUrl || response.data.data.downloadUrl, 
     message: response.data.data.message
     });


     } 
     catch (err) { console.log(err.response?.data || err.message); 
        res.status(500).json({ message: err.response?.data?.message || 'Download failed' }); } }); 
        
        module.exports = router;










        