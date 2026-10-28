const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    processId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImageProcessing' },
    patientName: { type: String, default: 'Anonymous Patient' },
    patientAge: { type: Number, default: 0 },
    patientId: { type: String },
    tumourDetected: { type: Boolean, default: false },
    tumourType: { type: String, default: 'None' },
    tumourSize: { type: Number, default: 0 },
    tumourLocation: { type: String, default: 'N/A' },
    confidenceScore: { type: Number, default: 0 },
    severityLevel: { type: String, default: 'None' },
    accuracy: { type: Number, default: 0 },
    detectionMethod: { type: String, default: 'DIP Algorithm' },
    processedImagePath: String
}, { timestamps: true });
module.exports = mongoose.model('DetectionResult', schema);