const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, 'Please provide an amount'],
        min: [0.01, 'Amount must be greater than 0']
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Please specify income or expense']
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        enum: [
            // Income categories
            'salary',
            'freelance',
            'investment',
            'bonus',
            'other_income',
            // Expense categories
            'food',
            'transport',
            'utilities',
            'entertainment',
            'healthcare',
            'shopping',
            'education',
            'rent',
            'other_expense'
        ]
    },
    date: {
        type: Date,
        required: [true, 'Please provide a date'],
        default: Date.now
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
        trim: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

// Index for faster queries
RecordSchema.index({ user: 1, date: -1 });
RecordSchema.index({ type: 1, category: 1 });

module.exports = mongoose.model('Record', RecordSchema);