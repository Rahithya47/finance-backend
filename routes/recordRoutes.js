const express = require('express');
const router = express.Router();

const {
    createRecord,
    getRecords,
    getRecord,
    updateRecord,
    deleteRecord,
    bulkCreateRecords
} = require('../controllers/recordController');

const { protect } = require('../middleware/auth');
const { authorize, restrictTo } = require('../middleware/role');
const { 
    validateRecord, 
    validateRecordUpdate, 
    validateObjectId,
    validateQueryParams 
} = require('../utils/validators');

// All routes require authentication
router.use(protect);

// Routes accessible by all authenticated users (read)
router.get('/', authorize('read'), validateQueryParams, getRecords);
router.get('/:id', authorize('read'), validateObjectId, getRecord);

// Routes accessible only by admin (create, update, delete)
router.post('/', authorize('create'), validateRecord, createRecord);
router.post('/bulk', authorize('create'), bulkCreateRecords);
router.put('/:id', authorize('update'), validateObjectId, validateRecordUpdate, updateRecord);
router.delete('/:id', authorize('delete'), validateObjectId, deleteRecord);

module.exports = router;