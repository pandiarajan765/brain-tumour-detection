const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    activityType: String, description: String,
    ipAddress: String, status: { type: String, default: 'success' }
}, { timestamps: true });
module.exports = mongoose.model('ActivityLog', schema);