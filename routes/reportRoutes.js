const r = require('express').Router();
const c = require('../controllers/reportController');
const auth = require('../middleware/auth');
r.get('/', auth, c.getReports); r.get('/:id', auth, c.viewReport);
module.exports = r;