const Report = require('../models/Report');
const ImageProcessing = require('../models/ImageProcessing');
const DetectionResult = require('../models/DetectionResult');

exports.getReports = async (req, res) => {
    const reports = await Report.find({ userId: req.session.user.id }).populate({ path: 'resultId', populate: 'processId' }).sort({ createdAt: -1 });
    res.render('reports', { reports });
};

exports.viewReport = async (req, res) => {
    const report = await Report.findById(req.params.id).populate({ path: 'resultId', populate: 'processId' });
    if (report) { report.downloadCount++; await report.save(); }
    const processings = await ImageProcessing.find({ userId: req.session.user.id }).sort({ createdAt: -1 });
    const results = await DetectionResult.find({ processId: { $in: processings.map(p => p._id) } }).populate('processId').sort({ createdAt: -1 });
    res.render('result', { report, processings, results });
};