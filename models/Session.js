const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    loginTime: { type: Date, default: Date.now }, logoutTime: Date,
    ipAddress: String, browserType: String, deviceType: String,
    sessionDuration: Number,
    status: { type: String, enum: ['active','expired'], default: 'active' }
}, { timestamps: true });
module.exports = mongoose.model('Session', schema);