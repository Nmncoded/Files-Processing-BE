# File Processing Backend System - Deployment Guide

## 🏗️ System Architecture

This backend system provides:
- File upload to AWS S3 (handles large files)
- Custom job queue system (no external dependencies)
- Asynchronous file processing with MongoDB storage
- Resilient line-by-line processing with error handling
- Job state persistence across server restarts
- Batch inserts to MongoDB to avoid overwhelming the database

## 📋 Prerequisites

- AWS Account with S3 access
- MongoDB instance (local or cloud like MongoDB Atlas)
- EC2 instance (Ubuntu 20.04 or later recommended)
- Node.js 18+ installed
- Git installed

## 🚀 EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. Launch Ubuntu 20.04 LTS instance (t2.medium or larger recommended)
2. Configure security group:
   - Port 22 (SSH)
   - Port 3000 (HTTP/Custom TCP)
   - Port 27017 (MongoDB, if self-hosting)
3. Create/download key pair for SSH access

### Step 2: Connect to EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Install Node.js

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation node
# node -v // i used 22.12.0 
# npm -v // i used 10.9.0
```

### Step 4: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## 📦 Application Deployment

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/file-processing-backend.git
cd file-processing-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following configuration:

```bash
PORT=3000
NODE_ENV=production

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket-name

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017
DB_NAME=fileprocessing
```

### Step 4: Create Required Directories

```bash
mkdir -p uploads temp
```

### Step 5: Test the Application

```bash
npm start
```

Visit: `http://your-ec2-public-ip:3000/health`

You should see a JSON response indicating the server is healthy.

### Step 6: Run with PM2 (Production)

```bash
# Start application with PM2
pm2 start src/server.js

# Monitor logs
pm2 logs

# Check status
pm2 status
```

## 🔐 AWS S3 Setup

### Step 1: Create S3 Bucket

```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

Or use AWS Console:
1. Go to S3 console
2. Click "Create bucket"
3. Enter bucket name
4. Select region
5. Keep default settings
6. Click "Create bucket"

### Step 2: Configure IAM User

Create an IAM user with programmatic access and attach this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

Save the Access Key ID and Secret Access Key for your .env file.

## 🧪 Testing the Endpoints 

### 1. Health Check

```bash
curl http://your-ec2-public-ip:3000/health
```

### 2. Upload File

```bash
curl -X POST http://your-ec2-public-ip:3000/upload \
  -F "file=@/path/to/your/file.txt"
```

Response:
```json
{
  "success": true,
  "fileId": "abc-123-def-456",
  "fileName": "file.txt",
  "message": "File uploaded successfully to S3",
  "size": 1024000
}
```

### 3. Process File

```bash
curl -X POST http://your-ec2-public-ip:3000/process/abc-123-def-456 \
  -H "Content-Type: application/json" \
  -d '{"fileName": "file.txt"}'
```

Response:
```json
{
  "success": true,
  "jobId": "xyz-789-uvw-012",
  "fileId": "abc-123-def-456",
  "status": "queued",
  "message": "Processing job enqueued",
  "checkStatusAt": "/job/xyz-789-uvw-012"
}
```

### 4. Check Job Status

```bash
curl http://your-ec2-public-ip:3000/job/xyz-789-uvw-012
```

Response:
```json
{
  "jobId": "xyz-789-uvw-012",
  "fileId": "abc-123-def-456",
  "fileName": "file.txt",
  "status": "processing",
  "progress": 45,
  "linesProcessed": 45000,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "startedAt": "2025-01-15T10:30:05.000Z"
}
```

### 5. List All Jobs

```bash
curl http://your-ec2-public-ip:3000/jobs
```

## 📊 System Features

### 1. Large File Handling
- Uses streaming for uploads (no memory constraints)
- Processes files line-by-line (doesn't load entire file)
- Supports files of any size

### 2. Resilient Processing
- Continues processing even if individual lines fail
- Tracks and reports errors without stopping
- Handles malformed data gracefully

### 3. Concurrent Job Processing
- Processes up to 2 jobs simultaneously
- Fair queueing system for multiple requests
- Server remains responsive during processing

### 4. MongoDB Optimization
- Batch inserts (1000 documents at a time)
- Prevents overwhelming the database
- Uses unordered inserts for better performance

### 5. Job State Persistence
- Saves job state to disk (`job-state.json`)
- Recovers jobs after server restart
- Marks interrupted jobs appropriately

## 🔍 Monitoring

### View PM2 Logs
```bash
pm2 logs
```


## 🛠️ Troubleshooting

### Issue: Cannot connect to MongoDB
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

### Issue: S3 upload fails
- Verify AWS credentials in .env
- Check IAM permissions
- Verify bucket name is correct
- Check AWS region

### Issue: Application crashes
```bash
# Check PM2 logs
pm2 logs file-processor --lines 100

# Restart application
pm2 restart file-processor
```

### Issue: Port 3000 already in use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
kill -9 <PID>
```

## 🔒 Security Best Practices

1. **Never commit .env file** to Git
2. Use AWS IAM roles instead of hardcoded credentials (if possible)
3. Set up CloudWatch monitoring
4. Configure security groups properly
5. Use HTTPS in production (setup Nginx reverse proxy with SSL)
6. Regularly update dependencies: `npm audit fix`
7. Set up automated backups for MongoDB

## 📈 Scaling Considerations

### Horizontal Scaling
- Deploy multiple EC2 instances behind a load balancer
- Use external job queue (Redis/RabbitMQ) for distributed processing
- Use MongoDB Atlas for managed database

### Vertical Scaling
- Upgrade EC2 instance type
- Increase `maxConcurrentJobs` in JobQueue class
- Adjust `batchSize` based on MongoDB performance

## 🎯 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload` | Upload file to S3 |
| POST | `/process/:fileId` | Enqueue processing job |
| GET | `/job/:jobId` | Check job status |
| GET | `/jobs` | List all jobs |

## 📝 File Format Support

The system can handle:
- **JSON Lines**: Each line is a valid JSON object
- **CSV/TSV**: Tab or comma-separated values
- **Plain Text**: Any text format (stored as raw lines)

Example JSON format:
```json
{"id": 1, "name": "John", "email": "john@example.com"}
{"id": 2, "name": "Jane", "email": "jane@example.com"}
```

## 🏁 Production Checklist

- [ ] EC2 instance launched and configured
- [ ] Security groups properly set
- [ ] Node.js and MongoDB installed
- [ ] Application deployed and tested
- [ ] PM2 configured for auto-restart
- [ ] Environment variables set correctly
- [ ] S3 bucket created with proper permissions
- [ ] MongoDB connection verified
- [ ] All endpoints tested
- [ ] Monitoring configured
- [ ] Backups scheduled

## 📞 Support

For issues or questions, please open an issue on the GitHub repository.

## 📄 License

MIT License