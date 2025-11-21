require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET: process.env.S3_BUCKET_NAME,
  
  // MongoDB
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017',
  DB_NAME: process.env.DB_NAME || 'fileprocessing',
  
  // File Upload
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  UPLOAD_DIR: 'uploads/',
  TEMP_DIR: 'temp/',
  
  // Job Queue
  MAX_CONCURRENT_JOBS: 2,
  BATCH_SIZE: 1000,
  JOB_STATE_FILE: 'job-state.json'
};