const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
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
app.use('/favicon.ico', (req, res) => res.status(204).end());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'brain_tumour_super_secret_2024',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        clientPromise: mongoose.connection.asPromise().then(() => mongoose.connection.getClient()),
        collectionName: 'sessions'
    }),
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
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));