import express from 'express';
import mongoose from 'mongoose';    
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import webpush from 'web-push';

// Import routes
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import commonRoutes from './routes/commonRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
dotenv.config();
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/HackRush';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('Error connecting to MongoDB', error);
    }
}

connectDB();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api', commonRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {  
    res.send('Campus Club Management API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong on the server'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
