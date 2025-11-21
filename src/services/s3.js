const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/config');

const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
  }
});

const uploadFileToS3 = async (fileId, fileStream, fileName) => {
  const uploadCommand = new PutObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: fileId,
    Body: fileStream,
    Metadata: {
      originalName: fileName,
      uploadedAt: new Date().toISOString()
    }
  });

  return await s3Client.send(uploadCommand);
};

const getFileFromS3 = async (fileId) => {
  const getCommand = new GetObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: fileId
  });
  
  return await s3Client.send(getCommand);
};

module.exports = {
  uploadFileToS3,
  getFileFromS3
};