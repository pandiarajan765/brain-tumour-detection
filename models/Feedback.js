const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String, required: true },
    feedbackType: { type: String, default: 'general' },
    responseStatus: { type: String, default: 'pending' },
    adminResponse: String, responseDate: Date
}, { timestamps: true });
module.exports = mongoose.model('Feedback', schema);
