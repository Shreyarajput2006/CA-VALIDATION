const mongoose = require('mongoose');

async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is missing in .env file");
        }

        await mongoose.connect(uri);
        console.log('MongoDB Atlas Connected');
    } catch (err) {
        console.log("MongoDB connection failed:", err.message);
    }
}

connectDB();

module.exports = mongoose;