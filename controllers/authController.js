const User = require('../models/User');
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
        const { name, email, password, phone, dob, gender } = req.body;
        if (await User.findOne({ email })) { req.session.error = 'Email already registered'; return res.redirect('/register'); }
        const user = await User.create({ name, email, password, phone, dob, gender, role: 'user' });
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
};