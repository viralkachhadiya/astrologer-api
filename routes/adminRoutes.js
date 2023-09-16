const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const handleFormData = require('../middlewares/formDataMiddleware')
const router = express.Router();

router.post('/register', handleFormData, adminController.createAdmin);
router.post('/update-password', handleFormData, adminController.changeAdminPassword);
router.post('/timeslot', handleFormData, adminController.interviewTimeslot);

module.exports = router;
