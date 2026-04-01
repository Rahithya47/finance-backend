const express = require('express');
const router = express.Router();

const {
    getSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
    getTopExpenses,
    getComparison
} = require('../controllers/dashboardController');

const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// All routes require authentication
router.use(protect);

// Routes accessible by all authenticated users (read permission)
router.get('/summary', authorize('read'), getSummary);
router.get('/categories', authorize('read'), getCategoryBreakdown);
router.get('/top-expenses', authorize('read'), getTopExpenses);

// Routes accessible by analyst and admin (analyze permission)
router.get('/trends', authorize('analyze'), getMonthlyTrends);
router.get('/comparison', authorize('analyze'), getComparison);

module.exports = router;