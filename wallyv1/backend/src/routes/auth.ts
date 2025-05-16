import express from 'express';
import { login, logout, validateSession } from '../controllers/authController';

const router = express.Router();

// Route for user login
router.post('/login', login);

// Route for user logout
router.post('/logout', logout);

// Route for session validation
router.post('/validate', validateSession);

export default router;