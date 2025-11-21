const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadFile } = require('../controllers/uploadController');

// Upload file to S3
router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;