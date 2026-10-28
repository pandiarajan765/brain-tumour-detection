const User = require('../models/User');
const ImageProcessing = require('../models/ImageProcessing');
const DetectionResult = require('../models/DetectionResult');
const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');

exports.getDashboard = async (req, res) => {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalScans = await ImageProcessing.countDocuments();
    const tumourDetected = await DetectionResult.countDocuments({ tumourDetected: true });
    const pendingFeedback = await Feedback.countDocuments({ responseStatus: 'pending' });
    const recentLogs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('userId');
    const feedbacks = await Feedback.find({ responseStatus: 'pending' }).populate('userId').limit(5);
    res.render('admin', { totalUsers, totalScans, tumourDetected, pendingFeedback, recentLogs, feedbacks });
};

exports.respondFeedback = async (req, res) => {
    await Feedback.findByIdAndUpdate(req.params.id, { adminResponse: req.body.response, responseStatus: 'responded', responseDate: new Date() });
    req.session.success = 'Response sent';
    res.redirect('/admin');
};

// ─── User CRUD ───────────────────────────────────────────────────────

exports.listUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const filter = search
        ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
        : {};
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);
    const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.render('user_list', { users, page, totalPages, search });
};

exports.renderCreateUser = (req, res) => {
    res.render('user_form', { editUser: null });
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, phone, dob, gender, role, status } = req.body;
        if (await User.findOne({ email })) {
            req.session.error = 'Email already exists';
            return res.redirect('/admin/users/create');
        }
        await User.create({ name, email, password, phone, dob, gender, role: role || 'user', status: status || 'active' });
        req.session.success = 'User created successfully';
        res.redirect('/admin/users');
    } catch (e) {
        req.session.error = 'Error creating user: ' + e.message;
        res.redirect('/admin/users/create');
    }
};

exports.renderEditUser = async (req, res) => {
    try {
        const editUser = await User.findById(req.params.id);
        if (!editUser) {
            req.session.error = 'User not found';
            return res.redirect('/admin/users');
        }
        res.render('user_form', { editUser });
    } catch (e) {
        req.session.error = 'Error: ' + e.message;
        res.redirect('/admin/users');
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, email, phone, dob, gender, role, status, password } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            req.session.error = 'User not found';
            return res.redirect('/admin/users');
        }
        user.name = name;
        user.email = email;
        user.phone = phone;
        user.dob = dob || user.dob;
        user.gender = gender;
        user.role = role;
        user.status = status;
        if (password && password.trim() !== '') {
            user.password = password;
        }
        await user.save();
        req.session.success = 'User updated successfully';
        res.redirect('/admin/users');
    } catch (e) {
        req.session.error = 'Error updating user: ' + e.message;
        res.redirect('/admin/users/' + req.params.id + '/edit');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.session.error = 'User not found';
            return res.redirect('/admin/users');
        }
        if (user._id.toString() === req.session.user.id) {
            req.session.error = 'You cannot delete your own account';
            return res.redirect('/admin/users');
        }
        await User.findByIdAndDelete(req.params.id);
        req.session.success = 'User deleted successfully';
        res.redirect('/admin/users');
    } catch (e) {
        req.session.error = 'Error deleting user: ' + e.message;
        res.redirect('/admin/users');
    }
};