const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'DetectionResult' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patientName: { type: String, default: 'Anonymous Patient' },
    patientAge: { type: Number, default: 0 },
    patientId: { type: String },
    reportType: { type: String, default: 'Detection Report' },
    findings: String, recommendations: String,
    generatedBy: { type: String, default: 'System' },
    reportFormat: { type: String, default: 'image' },
    downloadCount: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Report', schema);