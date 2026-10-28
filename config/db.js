const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brain_tumour_db';
    const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/brain_tumour_db';

    let conn = null;
    try {
        console.log('Connecting to MongoDB...');
        conn = await mongoose.connect(primaryUri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB Connected: ' + conn.connection.host);
    } catch (primaryErr) {
        if (primaryUri !== localUri) {
            console.warn('Notice: Primary database not reachable (' + primaryErr.message + ')');
            console.log('Auto-switching to Local Offline MongoDB: ' + localUri);
            try {
                conn = await mongoose.connect(localUri, {
                    serverSelectionTimeoutMS: 3000
                });
                console.log('Local MongoDB Connected (Offline Mode): ' + conn.connection.host);
            } catch (localErr) {
                console.error('All MongoDB connections failed: ' + localErr.message);
                process.exit(1);
            }
        } else {
            console.error('MongoDB Error: ' + primaryErr.message);
            process.exit(1);
        }
    }

    try {
        // Auto-drop obsolete collections removed from ER diagram
        const collections = await conn.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        if (collectionNames.includes('mriscans')) {
            await conn.connection.db.dropCollection('mriscans');
            console.log('Dropped obsolete collection: mriscans');
        }
        if (collectionNames.includes('notifications')) {
            await conn.connection.db.dropCollection('notifications');
            console.log('Dropped obsolete collection: notifications');
        }

        // Seed default admin if database is newly initialized
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                name: 'Pandiarajan (Admin)',
                email: 'pandiarajan.765@gmail.com',
                password: 'admin123',
                phone: '9876543210',
                gender: 'Male',
                role: 'admin',
                status: 'active'
            });
            console.log('Initialized default admin account: pandiarajan.765@gmail.com (password: admin123)');
        }
    } catch (e) {
        console.warn('Database initialization note:', e.message);
    }

    return conn;
};

module.exports = connectDB;
