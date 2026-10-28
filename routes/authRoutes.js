const r = require('express').Router();
const c = require('../controllers/authController');
r.get('/login', c.getLogin); r.get('/register', c.getRegister);
r.post('/register', c.postRegister); r.post('/login', c.postLogin);
r.get('/logout', c.getLogout);
module.exports = r;