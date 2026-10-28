const r = require('express').Router();
const c = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/roleCheck');
r.get('/', auth, admin, c.getDashboard);
r.post('/feedback/:id/respond', auth, admin, c.respondFeedback);
// User CRUD
r.get('/users', auth, admin, c.listUsers);
r.get('/users/create', auth, admin, c.renderCreateUser);
r.post('/users', auth, admin, c.createUser);
r.get('/users/:id/edit', auth, admin, c.renderEditUser);
r.post('/users/:id', auth, admin, c.updateUser);
r.post('/users/:id/delete', auth, admin, c.deleteUser);
module.exports = r;