const Record = require('../models/Record');

// @desc    Create new financial record
// @route   POST /api/records
// @access  Private/Admin
const createRecord = async (req, res) => {
    try {
        const { amount, type, category, date, notes } = req.body;

        const record = await Record.create({
            amount,
            type,
            category,
            date: date || Date.now(),
            notes,
            user: req.user.id,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Record created successfully',
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while creating record',
            details: error.message
        });
    }
};

// @desc    Get all records with filtering, sorting, pagination
// @route   GET /api/records
// @access  Private
const getRecords = async (req, res) => {
    try {
        // Build query
        let query = {};

        // Filter by type
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter by date range
        if (req.query.startDate || req.query.endDate) {
            query.date = {};
            if (req.query.startDate) {
                query.date.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.date.$lte = new Date(req.query.endDate);
            }
        }

        // Search in notes
        if (req.query.search) {
            query.notes = { $regex: req.query.search, $options: 'i' };
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // Sorting
        let sortBy = '-date'; // Default: newest first
        if (req.query.sortBy) {
            sortBy = req.query.sortBy;
        }

        // Execute query
        const records = await Record.find(query)
            .populate('user', 'name email')
            .populate('createdBy', 'name')
            .sort(sortBy)
            .skip(skip)
            .limit(limit);

        // Get total count
        const total = await Record.countDocuments(query);

        res.status(200).json({
            success: true,
            count: records.length,
            total,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            },
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while fetching records',
            details: error.message
        });
    }
};

// @desc    Get single record
// @route   GET /api/records/:id
// @access  Private
const getRecord = async (req, res) => {
    try {
        const record = await Record.findById(req.params.id)
            .populate('user', 'name email')
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name');

        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while fetching record',
            details: error.message
        });
    }
};

// @desc    Update record
// @route   PUT /api/records/:id
// @access  Private/Admin
const updateRecord = async (req, res) => {
    try {
        let record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        // Add updatedBy and updatedAt
        req.body.updatedBy = req.user.id;
        req.body.updatedAt = Date.now();

        record = await Record.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Record updated successfully',
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while updating record',
            details: error.message
        });
    }
};

// @desc    Delete record
// @route   DELETE /api/records/:id
// @access  Private/Admin
const deleteRecord = async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        await record.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Record deleted successfully',
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while deleting record',
            details: error.message
        });
    }
};

// @desc    Bulk create records
// @route   POST /api/records/bulk
// @access  Private/Admin
const bulkCreateRecords = async (req, res) => {
    try {
        const { records } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an array of records'
            });
        }

        // Add user info to each record
        const recordsWithUser = records.map(record => ({
            ...record,
            user: req.user.id,
            createdBy: req.user.id
        }));

        const createdRecords = await Record.insertMany(recordsWithUser);

        res.status(201).json({
            success: true,
            message: `${createdRecords.length} records created successfully`,
            count: createdRecords.length,
            data: createdRecords
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error while bulk creating records',
            details: error.message
        });
    }
};

module.exports = {
    createRecord,
    getRecords,
    getRecord,
    updateRecord,
    deleteRecord,
    bulkCreateRecords
};