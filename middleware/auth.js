module.exports = (req, res, next) => {
    if (req.session.user) return next();
    req.session.error = 'Please login first';
    res.redirect('/login');
};