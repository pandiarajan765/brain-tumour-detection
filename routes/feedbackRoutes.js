const r = require('express').Router();
const c = require('../controllers/feedbackController');
const auth = require('../middleware/auth');
r.get('/', auth, c.getFeedback); r.post('/', auth, c.postFeedback);
module.exports = r;