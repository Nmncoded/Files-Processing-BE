const multer = require('multer');
const config = require('../config/config');

const upload = multer({
  dest: config.UPLOAD_DIR,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  }
});

module.exports = upload;