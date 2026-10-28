const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1E9) + path.extname(file.originalname))
});
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|bmp|tiff/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
};
module.exports = multer({ storage, fileFilter, limits: { fileSize: 10*1024*1024 } });