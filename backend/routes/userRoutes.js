import express from 'express';
import { registerUser, loginUser, getUser, updateUser, deleteUser } from '../controllers/userController.js';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile/:email', verifyJWT, getUser);
router.put('/update/:email', verifyJWT, isAdmin, updateUser);
router.delete('/delete', verifyJWT, deleteUser);

// Admin routes
router.get('/admin/users', verifyJWT, isAdmin, (req, res) => {
  // This route will be implemented later
  res.status(501).json({ message: "Not implemented yet" });
});

export default router; 