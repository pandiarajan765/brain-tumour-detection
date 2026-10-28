const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    algorithmName: { type: String, required: true },
    algorithmType: String, version: { type: String, default: '1.0' },
    accuracyRate: { type: Number, default: 85 },
    description: String,
    status: { type: String, default: 'active' }
}, { timestamps: true });
module.exports = mongoose.model('Algorithm', schema);