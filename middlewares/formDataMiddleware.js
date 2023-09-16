const multer = require('multer');

const formDataMulter = multer();

const handleFormData = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    return res.status(400).json({ message: 'Invalid request format.' });
  }

  formDataMulter.any()(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error parsing FormData.' });
    }
    next();
  });
};

module.exports = handleFormData;