const r = require('express').Router();
const c = require('../controllers/scanController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
r.get('/upload', auth, c.getUpload);
r.post('/upload', auth, upload.single('mriImage'), c.postUpload);
r.get('/results', auth, c.getResults);
module.exports = r;