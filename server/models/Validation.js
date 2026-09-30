const mongoose = require('mongoose');

const validationSchema = new mongoose.Schema({
  userId: String,
  userName: String,

  type: {
    type: String,
    enum: ['PAN','TAN','GSTIN','AADHAAR','EMAIL','MOBILE']
  },

  value: String,

  status: {
    type: String,
    enum: ['Valid','Invalid']
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Validation', validationSchema);