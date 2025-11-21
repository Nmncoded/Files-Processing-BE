const fs = require('fs');
const { createReadStream } = require('fs');
const { v4: uuidv4 } = require('uuid');
const { uploadFileToS3 } = require('../services/s3');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileId = uuidv4();
    const fileName = req.file.originalname;
    const filePath = req.file.path;

    console.log('File ID:', fileId);
    console.log('File Name:', fileName);
    console.log('File Path:', filePath);

    const fileStream = createReadStream(filePath);
    await uploadFileToS3(fileId, fileStream, fileName);

    console.log('File uploaded successfully to S3', fileStream);

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      fileId,
      fileName,
      message: 'File uploaded successfully to S3',
      size: req.file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message 
    });
  }
};

module.exports = {
  uploadFile
};