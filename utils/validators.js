const { body, query, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// User registration validation
const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
    handleValidationErrors
];

// User login validation
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

// Record validation
const validateRecord = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('type')
        .notEmpty().withMessage('Type is required')
        .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn([
            'salary', 'freelance', 'investment', 'bonus', 'other_income',
            'food', 'transport', 'utilities', 'entertainment', 'healthcare',
            'shopping', 'education', 'rent', 'other_expense'
        ]).withMessage('Invalid category'),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    body('notes')
        .optional()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    handleValidationErrors
];

// Update record validation (partial)
const validateRecordUpdate = [
    body('amount')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('type')
        .optional()
        .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category')
        .optional()
        .isIn([
            'salary', 'freelance', 'investment', 'bonus', 'other_income',
            'food', 'transport', 'utilities', 'entertainment', 'healthcare',
            'shopping', 'education', 'rent', 'other_expense'
        ]).withMessage('Invalid category'),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    body('notes')
        .optional()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = [
    param('id')
        .isMongoId().withMessage('Invalid ID format'),
    handleValidationErrors
];

// Query parameters validation for listing
const validateQueryParams = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type')
        .optional()
        .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    query('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    query('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format'),
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateRecord,
    validateRecordUpdate,
    validateObjectId,
    validateQueryParams,
    handleValidationErrors
};