const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('./db');

const aadhaarRoutes = require('./routes/aadhaarRoutes'); 
const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const gstRoutes = require('./routes/gst');
const panRoutes = require('./routes/pan');
const tanRoutes = require('./routes/tan');
const emailRoutes = require('./routes/email');
const mobileRoutes = require('./routes/mobile');

const app = express();
const rateLimit = require('express-rate-limit');

// Trust proxy required for Render deployment to fix express-rate-limit error
app.set('trust proxy', 1);

// Rate Limiter for Spam Protection
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// 1. Middlewares & Static Files Setup
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/api/', apiLimiter); // Apply limiter to all API routes

// Root Directory (jahan index.html, login.html, etc. hain) se static files serve karein
app.use(express.static(path.join(__dirname, '../')));

// 2. API Routes
app.use('/api/gst', gstRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/pan', panRoutes);
app.use('/api/tan', tanRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/mobile', mobileRoutes); 
app.use('/api/aadhaar', aadhaarRoutes);

app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    res.json({ db_status: mongoose.connection.readyState });
});

// 3. HTML Routes (Explicitly serving main pages)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../assets/modules/login/login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../assets/modules/signup/signup.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../assets/modules/dashboard/dashboard.html'));
});

app.get('/test-tan-server', (req, res) => {
    res.json({
        server: 'CURRENT TAN SERVER',
        port: 5000
    });
});

// 404 Route - must be the last route
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../assets/modules/404/404.html'));
});

// 5. Server Start & Auto Launch Chromium
const PORT = 5001;

app.listen(PORT, () => {
    console.log(`✅ Server running at: http://localhost:${PORT}`);
});
















































