const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String, dob: Date,
    gender: { type: String, enum: ['Male','Female','Other'] },
    role: { type: String, enum: ['user','admin'], default: 'user' },
    address: String,
    status: { type: String, enum: ['active','inactive'], default: 'active' }
}, { timestamps: true });
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
userSchema.methods.comparePassword = async function(p) {
    return await bcrypt.compare(p, this.password);
};
module.exports = mongoose.model('User', userSchema);