module.exports = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') return next();
    req.session.error = 'Admin access required';
    res.redirect('/dashboard');
};