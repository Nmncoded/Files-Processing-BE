const AWS = require('aws-sdk');
const config = require('../config/config');

AWS.config.update({
  region: config.AWS_REGION,
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01'
});


const uploadFileToS3 = async (fileId, fileStream, fileName) => {
  const params = {
    Bucket: config.S3_BUCKET,
    Key: fileId,
    Body: fileStream,
    Metadata: {
      originalName: fileName,
      uploadedAt: new Date().toISOString()
    }
  };

  try {
    console.log(`Uploading file to S3: ${fileId}`);
    const result = await s3.upload(params).promise();
    console.log(`Upload successful: ${result.Location}`);
    return result;
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};


const getFileFromS3 = async (fileId) => {
  const params = {
    Bucket: config.S3_BUCKET,
    Key: fileId
  };

  try {
    console.log(`Fetching file from S3: ${fileId}`);
    
    const data = await s3.getObject(params).promise();
    
    console.log(`File fetched successfully. Size: ${data.ContentLength} bytes`);
    
    return {
      Body: data.Body, // This is a Buffer in v2
      ContentLength: data.ContentLength,
      ContentType: data.ContentType,
      Metadata: data.Metadata
    };
  } catch (error) {
    console.error('S3 GetObject Error:', error);
    
    if (error.code === 'NoSuchKey') {
      throw new Error(`File not found in S3: ${fileId}`);
    } else if (error.code === 'AccessDenied') {
      throw new Error(`Access denied to S3 file: ${fileId}`);
    } else {
      throw new Error(`Failed to get file from S3: ${error.message}`);
    }
  }
};


const getFileStreamFromS3 = (fileId) => {
  const params = {
    Bucket: config.S3_BUCKET,
    Key: fileId
  };

  console.log(`Creating read stream for S3 file: ${fileId}`);
  
  return s3.getObject(params).createReadStream();
};


const checkFileExists = async (fileId) => {
  const params = {
    Bucket: config.S3_BUCKET,
    Key: fileId
  };

  try {
    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
};

module.exports = {
  uploadFileToS3,
  getFileFromS3,
  getFileStreamFromS3,
  checkFileExists
};