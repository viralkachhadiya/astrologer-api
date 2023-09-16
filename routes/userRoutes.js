const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const handleFormData = require('../middlewares/formDataMiddleware')
const upload = require('../middlewares/multerMiddleware')

const router = express.Router();

router.post('/otp', handleFormData, userController.sendOTP);
router.post('/verify', handleFormData, userController.verifyOTP);
router.put('/edit-profile', handleFormData, userController.editUserProfile);
router.post('/book-consultation', handleFormData, userController.consultationForm);
router.post('/kundli', handleFormData, userController.saveKundli);
router.get('/fetch-kundli', userController.fetchKundli);
router.post('/wallet-add', handleFormData, userController.addAmount);
router.get('/view-profile', userController.getUser);
router.get('/fetch-astrologers', userController.getAstrologers);
router.get('/fetch-astrologers/:id', userController.getAstrologerById);
router.put('/upload-image', upload.single('file'), userController.uploadImage);

module.exports = router;
