const Feedback = require('../models/Feedback');
const User = require('../models/User');

exports.getFeedback = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        const feedbacks = await Feedback.find({ userId: req.session.user.id }).sort({ createdAt: -1 });
        
        let defaultLastName = '';
        if (user && user.name) {
            const parts = user.name.trim().split(/\s+/);
            defaultLastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
        }
        const defaultPhone = user && user.phone ? user.phone : '';

        res.render('feedback', { feedbacks, defaultLastName, defaultPhone, user });
    } catch (err) {
        console.error('Error fetching feedback:', err);
        res.render('feedback', { feedbacks: [], defaultLastName: '', defaultPhone: '', user: null });
    }
};

exports.postFeedback = async (req, res) => {
    try {
        const rating = parseInt(req.body.rating, 10) || 5;
        await Feedback.create({
            userId: req.session.user.id,
            lastName: req.body.lastName ? req.body.lastName.trim() : '',
            phone: req.body.phone ? req.body.phone.trim() : '',
            rating: Math.max(1, Math.min(5, rating)),
            comments: req.body.comments ? req.body.comments.trim() : '',
            feedbackType: req.body.feedbackType || 'general'
        });
        req.session.success = 'Feedback submitted successfully!';
        res.redirect('/feedback');
    } catch (err) {
        console.error('Error submitting feedback:', err);
        req.session.error = 'Failed to submit feedback: ' + err.message;
        res.redirect('/feedback');
    }
};
