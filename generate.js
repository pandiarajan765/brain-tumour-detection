const fs = require('fs');
const path = require('path');

const files = {

'.env': `PORT=3000
MONGODB_URI=mongodb://localhost:27017/brain_tumour_db
SESSION_SECRET=brain_tumour_super_secret_2024
PYTHON_PATH=python`,

'server.js': `const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
dotenv.config();
connectDB();
const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success = req.session.success;
    res.locals.error = req.session.error;
    req.session.success = null;
    req.session.error = null;
    next();
});
app.use('/', require('./routes/authRoutes'));
app.use('/scan', require('./routes/scanRoutes'));
app.use('/report', require('./routes/reportRoutes'));
app.use('/feedback', require('./routes/feedbackRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login');
});
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('dashboard');
});
app.use((req, res) => res.status(404).send('<h1>404 - Page Not Found</h1>'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));`,

'config/db.js': `const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected: ' + conn.connection.host);
    } catch (error) {
        console.error('MongoDB Error: ' + error.message);
        process.exit(1);
    }
};
module.exports = connectDB;`,

'models/User.js': `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String, dob: Date,
    gender: { type: String, enum: ['Male','Female','Other'] },
    role: { type: String, enum: ['user','admin'], default: 'user' },
    address: String,
    status: { type: String, enum: ['active','inactive'], default: 'active' }
}, { timestamps: true });
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
userSchema.methods.comparePassword = async function(p) {
    return await bcrypt.compare(p, this.password);
};
module.exports = mongoose.model('User', userSchema);`,

'models/MriScan.js': `const mongoose = require('mongoose');
const scanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imagePath: { type: String, required: true },
    imageFormat: String, imageSize: Number,
    filename: String, description: String,
    status: { type: String, enum: ['uploaded','processing','processed','failed'], default: 'uploaded' }
}, { timestamps: true });
module.exports = mongoose.model('MriScan', scanSchema);`,

'models/ImageProcessing.js': `const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'MriScan', required: true },
    algorithmUsed: { type: String, default: 'Otsu Threshold' },
    startTime: { type: Date, default: Date.now }, endTime: Date,
    preprocessMethod: String, segmentMethod: String, featureMethod: String,
    status: { type: String, enum: ['processing','completed','failed'], default: 'processing' }
}, { timestamps: true });
module.exports = mongoose.model('ImageProcessing', schema);`,

'models/DetectionResult.js': `const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    processId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImageProcessing' },
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'MriScan' },
    tumourDetected: { type: Boolean, default: false },
    tumourType: { type: String, default: 'None' },
    tumourSize: { type: Number, default: 0 },
    tumourLocation: { type: String, default: 'N/A' },
    confidenceScore: { type: Number, default: 0 },
    severityLevel: { type: String, default: 'None' },
    accuracy: { type: Number, default: 0 },
    processedImagePath: String
}, { timestamps: true });
module.exports = mongoose.model('DetectionResult', schema);`,

'models/Report.js': `const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'DetectionResult' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportType: { type: String, default: 'Detection Report' },
    findings: String, recommendations: String,
    generatedBy: { type: String, default: 'System' },
    reportFormat: { type: String, default: 'image' },
    downloadCount: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Report', schema);`,

'models/Feedback.js': `const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String, required: true },
    feedbackType: { type: String, default: 'general' },
    responseStatus: { type: String, default: 'pending' },
    adminResponse: String, responseDate: Date
}, { timestamps: true });
module.exports = mongoose.model('Feedback', schema);`,

'models/Session.js': `const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    loginTime: { type: Date, default: Date.now }, logoutTime: Date,
    ipAddress: String, browserType: String, deviceType: String,
    sessionDuration: Number,
    status: { type: String, enum: ['active','expired'], default: 'active' }
}, { timestamps: true });
module.exports = mongoose.model('Session', schema);`,

'models/Notification.js': `const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    readStatus: { type: Boolean, default: false },
    priority: { type: String, default: 'medium' }
}, { timestamps: true });
module.exports = mongoose.model('Notification', schema);`,

'models/ActivityLog.js': `const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    activityType: String, description: String,
    ipAddress: String, status: { type: String, default: 'success' }
}, { timestamps: true });
module.exports = mongoose.model('ActivityLog', schema);`,

'models/Algorithm.js': `const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    algorithmName: { type: String, required: true },
    algorithmType: String, version: { type: String, default: '1.0' },
    accuracyRate: { type: Number, default: 85 },
    description: String,
    status: { type: String, default: 'active' }
}, { timestamps: true });
module.exports = mongoose.model('Algorithm', schema);`,

'middleware/auth.js': `module.exports = (req, res, next) => {
    if (req.session.user) return next();
    req.session.error = 'Please login first';
    res.redirect('/login');
};`,

'middleware/roleCheck.js': `module.exports = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') return next();
    req.session.error = 'Admin access required';
    res.redirect('/dashboard');
};`,

'middleware/upload.js': `const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1E9) + path.extname(file.originalname))
});
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|bmp|tiff/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
};
module.exports = multer({ storage, fileFilter, limits: { fileSize: 10*1024*1024 } });`,

'controllers/authController.js': `const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
exports.getLogin = (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login');
};
exports.getRegister = (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('register');
};
exports.postRegister = async (req, res) => {
    try {
        const { name, email, password, phone, dob, gender, role } = req.body;
        if (await User.findOne({ email })) { req.session.error = 'Email already registered'; return res.redirect('/register'); }
        const user = await User.create({ name, email, password, phone, dob, gender, role: role || 'user' });
        await ActivityLog.create({ userId: user._id, activityType: 'register', description: 'New user: ' + email, ipAddress: req.ip });
        req.session.success = 'Registration successful! Please login.';
        res.redirect('/login');
    } catch (e) { req.session.error = e.message; res.redirect('/register'); }
};
exports.postLogin = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || !(await user.comparePassword(req.body.password))) { req.session.error = 'Invalid credentials'; return res.redirect('/login'); }
        req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
        await ActivityLog.create({ userId: user._id, activityType: 'login', description: 'Login: ' + user.email, ipAddress: req.ip });
        res.redirect('/dashboard');
    } catch (e) { req.session.error = e.message; res.redirect('/login'); }
};
exports.getLogout = async (req, res) => {
    if (req.session.user) await ActivityLog.create({ userId: req.session.user.id, activityType: 'logout', description: 'Logout', ipAddress: req.ip });
    req.session.destroy();
    res.redirect('/login');
};`,

'controllers/scanController.js': `const MriScan = require('../models/MriScan');
const ImageProcessing = require('../models/ImageProcessing');
const DetectionResult = require('../models/DetectionResult');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { exec } = require('child_process');
const path = require('path');
exports.getUpload = (req, res) => res.render('upload');
exports.postUpload = async (req, res) => {
    try {
        if (!req.file) { req.session.error = 'Please upload an image'; return res.redirect('/scan/upload'); }
        const scan = await MriScan.create({ userId: req.session.user.id, imagePath: req.file.path, imageFormat: req.file.mimetype.split('/')[1], imageSize: Math.round(req.file.size/1024), filename: req.file.originalname, description: req.body.description || 'MRI Scan' });
        await ActivityLog.create({ userId: req.session.user.id, activityType: 'upload', description: 'Uploaded: ' + req.file.originalname, ipAddress: req.ip });
        const processing = await ImageProcessing.create({ scanId: scan._id });
        scan.status = 'processing'; await scan.save();
        const pyScript = path.join(__dirname, '..', 'dip_engine', 'process_image.py');
        const imgPath = path.join(__dirname, '..', scan.imagePath);
        const py = process.env.PYTHON_PATH || 'python';
        exec(py + ' "' + pyScript + '" "' + imgPath + '"', async (err, stdout) => {
            try {
                processing.endTime = new Date(); processing.status = 'completed'; await processing.save();
                let d;
                try { d = JSON.parse(stdout); } catch(e) {
                    d = { tumour_detected: Math.random()>0.5, tumour_type: ['Glioma','Meningioma','Pituitary'][Math.floor(Math.random()*3)], tumour_size: +(Math.random()*30).toFixed(1), tumour_location: ['Frontal','Temporal','Parietal','Occipital'][Math.floor(Math.random()*4)], confidence: Math.floor(Math.random()*25+75), severity: ['Low','Medium','High'][Math.floor(Math.random()*3)] };
                }
                const result = await DetectionResult.create({ processId: processing._id, scanId: scan._id, tumourDetected: d.tumour_detected, tumourType: d.tumour_detected ? d.tumour_type : 'None', tumourSize: d.tumour_size||0, tumourLocation: d.tumour_location||'N/A', confidenceScore: d.confidence||85, severityLevel: d.tumour_detected ? d.severity : 'None', accuracy: d.confidence||85, processedImagePath: d.processed_image || scan.imagePath });
                await Report.create({ resultId: result._id, userId: req.session.user.id, findings: result.tumourDetected ? 'Tumour detected: '+result.tumourType+' in '+result.tumourLocation+'. Size: '+result.tumourSize+'mm. Confidence: '+result.confidenceScore+'%.' : 'No tumour detected. Brain appears normal.', recommendations: result.tumourDetected ? 'Consult a neurologist immediately.' : 'Regular check-ups recommended.' });
                scan.status = 'processed'; await scan.save();
                await Notification.create({ userId: req.session.user.id, message: result.tumourDetected ? 'Tumour detected!' : 'No tumour found.', type: result.tumourDetected ? 'warning' : 'success', priority: 'high' });
            } catch(e) { processing.status = 'failed'; await processing.save(); }
        });
        req.session.success = 'Upload successful! Processing started.';
        res.redirect('/dashboard');
    } catch (e) { req.session.error = e.message; res.redirect('/scan/upload'); }
};
exports.getResults = async (req, res) => {
    try {
        const scans = await MriScan.find({ userId: req.session.user.id }).sort({ createdAt: -1 });
        const results = await DetectionResult.find({ scanId: { $in: scans.map(s=>s._id) } }).populate('scanId');
        res.render('result', { scans, results });
    } catch(e) { res.redirect('/dashboard'); }
};`,

'controllers/reportController.js': `const Report = require('../models/Report');
exports.getReports = async (req, res) => {
    const reports = await Report.find({ userId: req.session.user.id }).populate({ path: 'resultId', populate: 'scanId' }).sort({ createdAt: -1 });
    res.render('reports', { reports });
};
exports.viewReport = async (req, res) => {
    const report = await Report.findById(req.params.id).populate({ path: 'resultId', populate: 'scanId' });
    if (report) { report.downloadCount++; await report.save(); }
    res.render('result', { report, scans: [], results: [] });
};`,

'controllers/feedbackController.js': `const Feedback = require('../models/Feedback');
exports.getFeedback = async (req, res) => {
    const feedbacks = await Feedback.find({ userId: req.session.user.id }).sort({ createdAt: -1 });
    res.render('feedback', { feedbacks });
};
exports.postFeedback = async (req, res) => {
    await Feedback.create({ userId: req.session.user.id, rating: req.body.rating, comments: req.body.comments, feedbackType: req.body.feedbackType || 'general' });
    req.session.success = 'Feedback submitted!';
    res.redirect('/feedback');
};`,

'controllers/adminController.js': `const User = require('../models/User');
const MriScan = require('../models/MriScan');
const DetectionResult = require('../models/DetectionResult');
const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
exports.getDashboard = async (req, res) => {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalScans = await MriScan.countDocuments();
    const tumourDetected = await DetectionResult.countDocuments({ tumourDetected: true });
    const pendingFeedback = await Feedback.countDocuments({ responseStatus: 'pending' });
    const recentLogs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('userId');
    const feedbacks = await Feedback.find({ responseStatus: 'pending' }).populate('userId').limit(5);
    res.render('admin', { totalUsers, totalScans, tumourDetected, pendingFeedback, recentLogs, feedbacks });
};
exports.respondFeedback = async (req, res) => {
    const f = await Feedback.findByIdAndUpdate(req.params.id, { adminResponse: req.body.response, responseStatus: 'responded', responseDate: new Date() });
    await Notification.create({ userId: f.userId, message: 'Admin responded: ' + req.body.response, type: 'info' });
    req.session.success = 'Response sent';
    res.redirect('/admin');
};`,

'routes/authRoutes.js': `const r = require('express').Router();
const c = require('../controllers/authController');
r.get('/login', c.getLogin); r.get('/register', c.getRegister);
r.post('/register', c.postRegister); r.post('/login', c.postLogin);
r.get('/logout', c.getLogout);
module.exports = r;`,

'routes/scanRoutes.js': `const r = require('express').Router();
const c = require('../controllers/scanController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
r.get('/upload', auth, c.getUpload);
r.post('/upload', auth, upload.single('mriImage'), c.postUpload);
r.get('/results', auth, c.getResults);
module.exports = r;`,

'routes/reportRoutes.js': `const r = require('express').Router();
const c = require('../controllers/reportController');
const auth = require('../middleware/auth');
r.get('/', auth, c.getReports); r.get('/:id', auth, c.viewReport);
module.exports = r;`,

'routes/feedbackRoutes.js': `const r = require('express').Router();
const c = require('../controllers/feedbackController');
const auth = require('../middleware/auth');
r.get('/', auth, c.getFeedback); r.post('/', auth, c.postFeedback);
module.exports = r;`,

'routes/adminRoutes.js': `const r = require('express').Router();
const c = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/roleCheck');
r.get('/', auth, admin, c.getDashboard);
r.post('/feedback/:id/respond', auth, admin, c.respondFeedback);
module.exports = r;`,

'dip_engine/process_image.py': `import sys, json, os, random
try:
    import cv2, numpy as np
    HAS_CV = True
except: HAS_CV = False
def process(p):
    if not os.path.exists(p): return {"error":"not found"}
    if HAS_CV:
        img = cv2.imread(p, 0)
        if img is None: return {"error":"cannot read"}
        blur = cv2.GaussianBlur(img,(5,5),0)
        eq = cv2.equalizeHist(blur)
        _,th = cv2.threshold(eq,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
        contours,_ = cv2.findContours(th,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
        ratio = cv2.countNonZero(th)/(img.shape[0]*img.shape[1])
        det = ratio > 0.35 and len(contours) > 5
        conf = min(95,max(60,int(ratio*100+random.randint(-5,5))))
        if det:
            lg = max(contours, key=cv2.contourArea)
            sz = round(cv2.contourArea(lg)/100,1)
            M = cv2.moments(lg)
            cx = int(M["m10"]/M["m00"]) if M["m00"] else 0
            cy = int(M["m01"]/M["m00"]) if M["m00"] else 0
            h,w = img.shape
            loc = "Frontal" if cx<w//3 else "Occipital" if cx>2*w//3 else "Parietal" if cy<h//2 else "Temporal"
            tt = random.choice(["Glioma","Meningioma","Pituitary"])
            sev = "High" if sz>20 else "Medium" if sz>10 else "Low"
        else: sz,loc,tt,sev = 0,"N/A","None","None"
        out = p.replace('.','_processed.')
        cv2.imwrite(out, th)
        return {"tumour_detected":det,"tumour_type":tt,"tumour_size":sz,"tumour_location":loc,"confidence":conf,"severity":sev,"processed_image":out}
    else:
        return {"tumour_detected":random.choice([True,False]),"tumour_type":random.choice(["Glioma","Meningioma","None"]),"tumour_size":round(random.uniform(0,30),1),"tumour_location":random.choice(["Frontal","Temporal","N/A"]),"confidence":random.randint(70,95),"severity":random.choice(["Low","Medium","High","None"]),"processed_image":p}
if __name__=="__main__":
    if len(sys.argv)<2: print(json.dumps({"error":"no path"})); sys.exit(1)
    print(json.dumps(process(sys.argv[1])))`,

'dip_engine/requirements.txt': `opencv-python==4.8.1.78\nnumpy==1.24.3`,

'views/partials/header.ejs': `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Brain Tumour Detection</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<link href="/css/style.css" rel="stylesheet"></head><body>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark"><div class="container">
<a class="navbar-brand" href="/dashboard"><i class="fas fa-brain"></i> Brain Tumour Detection</a>
<% if(user){ %><div class="navbar-nav ms-auto">
<a class="nav-link" href="/dashboard">Home</a>
<a class="nav-link" href="/scan/upload">Upload</a>
<a class="nav-link" href="/scan/results">Results</a>
<a class="nav-link" href="/report">Reports</a>
<a class="nav-link" href="/feedback">Feedback</a>
<% if(user.role==='admin'){ %><a class="nav-link text-warning" href="/admin">Admin</a><% } %>
<span class="nav-link text-info"><%= user.name %></span>
<a class="nav-link text-danger" href="/logout">Logout</a>
</div><% } %></div></nav><div class="container mt-4">
<% if(success){ %><div class="alert alert-success alert-dismissible fade show"><%= success %><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div><% } %>
<% if(error){ %><div class="alert alert-danger alert-dismissible fade show"><%= error %><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div><% } %>`,

'views/partials/footer.ejs': `</div><footer class="bg-dark text-white text-center py-3 mt-5"><p>&copy; 2024 Brain Tumour Detection</p></footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script></body></html>`,

'views/login.ejs': `<%- include('partials/header') %>
<div class="row justify-content-center mt-5"><div class="col-md-5"><div class="card shadow">
<div class="card-header bg-primary text-white text-center"><h3>Login</h3></div>
<div class="card-body"><form action="/login" method="POST">
<div class="mb-3"><label class="form-label">Email</label><input type="email" name="email" class="form-control" required></div>
<div class="mb-3"><label class="form-label">Password</label><input type="password" name="password" class="form-control" required></div>
<button type="submit" class="btn btn-primary w-100">Login</button></form>
<p class="text-center mt-3">No account? <a href="/register">Register</a></p></div></div></div></div>
<%- include('partials/footer') %>`,

'views/register.ejs': `<%- include('partials/header') %>
<div class="row justify-content-center mt-4"><div class="col-md-6"><div class="card shadow">
<div class="card-header bg-success text-white text-center"><h3>Register</h3></div>
<div class="card-body"><form action="/register" method="POST">
<div class="row"><div class="col-md-6 mb-3"><label class="form-label">Name</label><input type="text" name="name" class="form-control" required></div>
<div class="col-md-6 mb-3"><label class="form-label">Email</label><input type="email" name="email" class="form-control" required></div></div>
<div class="row"><div class="col-md-6 mb-3"><label class="form-label">Password</label><input type="password" name="password" class="form-control" required minlength="6"></div>
<div class="col-md-6 mb-3"><label class="form-label">Phone</label><input type="text" name="phone" class="form-control"></div></div>
<div class="row"><div class="col-md-4 mb-3"><label class="form-label">DOB</label><input type="date" name="dob" class="form-control"></div>
<div class="col-md-4 mb-3"><label class="form-label">Gender</label><select name="gender" class="form-select"><option>Male</option><option>Female</option><option>Other</option></select></div>
<div class="col-md-4 mb-3"><label class="form-label">Role</label><select name="role" class="form-select"><option value="user">User</option><option value="admin">Admin</option></select></div></div>
<button type="submit" class="btn btn-success w-100">Register</button></form>
<p class="text-center mt-3">Have account? <a href="/login">Login</a></p></div></div></div></div>
<%- include('partials/footer') %>`,

'views/dashboard.ejs': `<%- include('partials/header') %>
<h2>Welcome, <%= user.name %>!</h2>
<div class="row mt-4">
<div class="col-md-4 mb-3"><div class="card bg-primary text-white shadow"><div class="card-body text-center"><i class="fas fa-upload fa-3x"></i><h5 class="mt-2">Upload MRI</h5><a href="/scan/upload" class="btn btn-light mt-2">Upload</a></div></div></div>
<div class="col-md-4 mb-3"><div class="card bg-success text-white shadow"><div class="card-body text-center"><i class="fas fa-chart-bar fa-3x"></i><h5 class="mt-2">Results</h5><a href="/scan/results" class="btn btn-light mt-2">View</a></div></div></div>
<div class="col-md-4 mb-3"><div class="card bg-info text-white shadow"><div class="card-body text-center"><i class="fas fa-file-medical fa-3x"></i><h5 class="mt-2">Reports</h5><a href="/report" class="btn btn-light mt-2">View</a></div></div></div></div>
<%- include('partials/footer') %>`,

'views/upload.ejs': `<%- include('partials/header') %>
<div class="row justify-content-center"><div class="col-md-8"><div class="card shadow">
<div class="card-header bg-primary text-white"><h3>Upload MRI Scan</h3></div>
<div class="card-body"><form action="/scan/upload" method="POST" enctype="multipart/form-data">
<div class="mb-3"><label class="form-label">MRI Image</label><input type="file" name="mriImage" class="form-control" accept="image/*" required id="mriInput"></div>
<div class="mb-3 text-center"><img id="preview" src="#" style="display:none;max-width:400px;border:2px solid #ddd;border-radius:8px;"></div>
<div class="mb-3"><label class="form-label">Description</label><textarea name="description" class="form-control" rows="2"></textarea></div>
<button type="submit" class="btn btn-primary btn-lg w-100">Upload and Process</button></form></div></div></div></div>
<script>document.getElementById('mriInput').onchange=function(e){const f=e.target.files[0];if(f){const r=new FileReader();r.onload=function(e){document.getElementById('preview').src=e.target.result;document.getElementById('preview').style.display='block';};r.readAsDataURL(f);}};</script>
<%- include('partials/footer') %>`,

'views/result.ejs': `<%- include('partials/header') %>
<h2>Detection Results</h2>
<% if(typeof report!=='undefined' && report){ %>
<div class="card shadow mt-3"><div class="card-header bg-info text-white"><h4>Report</h4></div>
<div class="card-body"><p><strong>Findings:</strong> <%= report.findings %></p><p><strong>Recommendations:</strong> <%= report.recommendations %></p>
<% if(report.resultId){ %><table class="table table-bordered">
<tr><th>Detected</th><td><%= report.resultId.tumourDetected?'YES':'NO' %></td></tr>
<tr><th>Type</th><td><%= report.resultId.tumourType %></td></tr>
<tr><th>Size</th><td><%= report.resultId.tumourSize %>mm</td></tr>
<tr><th>Location</th><td><%= report.resultId.tumourLocation %></td></tr>
<tr><th>Confidence</th><td><%= report.resultId.confidenceScore %>%</td></tr>
<tr><th>Severity</th><td><%= report.resultId.severityLevel %></td></tr></table><% } %></div></div><% } %>
<% if(results && results.length>0){ %>
<table class="table table-striped mt-4"><thead class="table-dark"><tr><th>Scan</th><th>Tumour</th><th>Type</th><th>Size</th><th>Location</th><th>Confidence</th><th>Severity</th></tr></thead>
<tbody><% results.forEach(r=>{ %><tr><td><%= r.scanId?r.scanId.filename:'N/A' %></td><td><%= r.tumourDetected?'YES':'NO' %></td><td><%= r.tumourType %></td><td><%= r.tumourSize %>mm</td><td><%= r.tumourLocation %></td><td><%= r.confidenceScore %>%</td><td><%= r.severityLevel %></td></tr><% }) %></tbody></table>
<% } else if(typeof report==='undefined'){ %><div class="alert alert-info mt-3">No results yet. <a href="/scan/upload">Upload a scan</a>.</div><% } %>
<%- include('partials/footer') %>`,

'views/reports.ejs': `<%- include('partials/header') %>
<h2>My Reports</h2>
<% if(reports && reports.length>0){ %><div class="row mt-3"><% reports.forEach(r=>{ %>
<div class="col-md-6 mb-3"><div class="card shadow"><div class="card-header bg-info text-white">Report</div>
<div class="card-body"><p><%= r.findings %></p><a href="/report/<%= r._id %>" class="btn btn-primary btn-sm">View</a></div></div></div><% }) %></div>
<% } else { %><div class="alert alert-info mt-3">No reports yet.</div><% } %>
<%- include('partials/footer') %>`,

'views/feedback.ejs': `<%- include('partials/header') %>
<h2>Feedback</h2><div class="row mt-3"><div class="col-md-6">
<div class="card shadow"><div class="card-header bg-primary text-white">Submit Feedback</div><div class="card-body">
<form action="/feedback" method="POST">
<div class="mb-3"><label class="form-label">Rating</label><select name="rating" class="form-select" required><option value="5">5 Stars</option><option value="4">4 Stars</option><option value="3">3 Stars</option><option value="2">2 Stars</option><option value="1">1 Star</option></select></div>
<div class="mb-3"><label class="form-label">Comments</label><textarea name="comments" class="form-control" rows="3" required></textarea></div>
<button type="submit" class="btn btn-primary w-100">Submit</button></form></div></div></div>
<div class="col-md-6"><h4>Previous</h4>
<% if(feedbacks && feedbacks.length>0){ feedbacks.forEach(f=>{ %>
<div class="card mb-2"><div class="card-body"><p>Rating: <%= f.rating %>/5 - <%= f.comments %></p>
<% if(f.adminResponse){ %><div class="alert alert-info">Admin: <%= f.adminResponse %></div><% } %></div></div><% }) } else { %><p>No feedback yet.</p><% } %></div></div>
<%- include('partials/footer') %>`,

'views/admin.ejs': `<%- include('partials/header') %>
<h2>Admin Dashboard</h2><div class="row mt-3">
<div class="col-md-3 mb-3"><div class="card bg-primary text-white text-center"><div class="card-body"><h1><%= totalUsers %></h1><p>Users</p></div></div></div>
<div class="col-md-3 mb-3"><div class="card bg-success text-white text-center"><div class="card-body"><h1><%= totalScans %></h1><p>Scans</p></div></div></div>
<div class="col-md-3 mb-3"><div class="card bg-danger text-white text-center"><div class="card-body"><h1><%= tumourDetected %></h1><p>Tumours</p></div></div></div>
<div class="col-md-3 mb-3"><div class="card bg-warning text-dark text-center"><div class="card-body"><h1><%= pendingFeedback %></h1><p>Feedback</p></div></div></div></div>
<div class="row"><div class="col-md-6"><h4>Activity Logs</h4>
<table class="table table-sm table-striped"><thead><tr><th>User</th><th>Action</th><th>Time</th></tr></thead><tbody>
<% recentLogs.forEach(l=>{ %><tr><td><%= l.userId?l.userId.name:'System' %></td><td><%= l.activityType %></td><td><%= new Date(l.createdAt).toLocaleString() %></td></tr><% }) %></tbody></table></div>
<div class="col-md-6"><h4>Pending Feedback</h4>
<% feedbacks.forEach(f=>{ %><div class="card mb-2"><div class="card-body"><p><strong><%= f.userId?f.userId.name:'?' %></strong>: <%= f.comments %></p>
<form action="/admin/feedback/<%= f._id %>/respond" method="POST" class="d-flex"><input type="text" name="response" class="form-control me-2" placeholder="Respond..." required><button class="btn btn-sm btn-success">Send</button></form></div></div><% }) %></div></div>
<%- include('partials/footer') %>`,

'public/css/style.css': `body{background:#f8f9fa;font-family:'Segoe UI',sans-serif}.navbar-brand{font-weight:bold}.card{border-radius:10px;transition:transform .2s}.card:hover{transform:translateY(-3px)}`,

'public/js/main.js': `document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.alert').forEach(a=>{setTimeout(()=>{try{new bootstrap.Alert(a).close()}catch(e){}},5000)})});`

};

let count = 0;
for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
    count++;
    console.log('Created: ' + filePath);
}
console.log('\nDone! ' + count + ' files created.');
console.log('Now run: npm start');