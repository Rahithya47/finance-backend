const express = require('express');
const router = express.Router();

const {
    register,
    login,
    getMe,
    getUsers,
    updateUserRole
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { validateRegister, validateLogin, validateObjectId } = require('../utils/validators');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);

// Admin only routes
router.get('/users', protect, restrictTo('admin'), getUsers);
router.put('/users/:id/role', protect, restrictTo('admin'), validateObjectId, updateUserRole);

module.exports = router;