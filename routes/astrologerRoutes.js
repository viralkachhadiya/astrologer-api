const express = require('express');
const authController = require('../controllers/astrologerController');
const authMiddleware = require('../middlewares/authMiddleware');
const handleFormData = require('../middlewares/formDataMiddleware')
const multer = require('multer');
const upload = multer();
const router = express.Router();

router.post('/otp', handleFormData, authController.sendOTP);
router.post('/verify', handleFormData, authController.verifyOTP);
router.post('/register', handleFormData, authController.registerAstrologer);
router.post('/login', handleFormData, authController.login);
router.post('/password', handleFormData, authController.updatePassword);
router.get('/fetch-timeslots', authController.fetchTimeslots);
router.get('/view-profile', authController.viewProfile);
router.get('/consultations', authController.fetchConsultations);
router.get('/consultations/:id', authController.fetchConsultationsById);
router.put('/update-profile', handleFormData, authController.updateProfile);
router.put('/upload-image', upload.single('file'), authController.uploadImage);

module.exports = router;
