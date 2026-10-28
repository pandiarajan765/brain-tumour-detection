const mongoose = require('mongoose');

const imageProcessingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, default: 'Anonymous Patient' },
    patientAge: { type: Number, default: 0 },
    generatedUserId: { type: String },
    algorithmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Algorithm' },
    algorithmUsed: { type: String, default: 'Otsu Threshold' },
    segmentationMethod: { type: String, default: 'Otsu Thresholding & Contour Area' },
    originalImage: { type: String, required: true },
    processingTime: { type: Number, default: 0 },
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' }
}, { timestamps: true });

module.exports = mongoose.model('ImageProcessing', imageProcessingSchema);