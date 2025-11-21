const fs = require('fs');
const path = require('path');
const { createReadStream } = require('fs');
const readline = require('readline');
const { MongoClient } = require('mongodb');
const config = require('../config/config');
const { getFileFromS3 } = require('./s3');

class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.queue = [];
    this.processing = false;
    this.maxConcurrentJobs = config.MAX_CONCURRENT_JOBS;
    this.activeJobs = 0;
    this.batchSize = config.BATCH_SIZE;
    this.loadPersistedJobs();
  }

  // Persist jobs to disk for restart resilience
  persistJobs() {
    const jobData = {
      jobs: Array.from(this.jobs.entries()),
      queue: this.queue
    };
    fs.writeFileSync(config.JOB_STATE_FILE, JSON.stringify(jobData, null, 2));
  }

  loadPersistedJobs() {
    try {
      if (fs.existsSync(config.JOB_STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(config.JOB_STATE_FILE, 'utf8'));
        this.jobs = new Map(data.jobs);
        this.queue = data.queue || [];
        
        // Reset any jobs that were processing when server stopped
        for (let [jobId, job] of this.jobs) {
          if (job.status === 'processing') {
            job.status = 'queued';
            job.error = 'Server restarted during processing';
          }
        }
        console.log(`Loaded ${this.jobs.size} persisted jobs`);
      }
    } catch (error) {
      console.error('Error loading persisted jobs:', error);
    }
  }

  enqueue(jobId, fileId, fileName) {
    const job = {
      jobId,
      fileId,
      fileName,
      status: 'queued',
      createdAt: new Date(),
      progress: 0,
      linesProcessed: 0,
      errors: []
    };
    
    this.jobs.set(jobId, job);
    this.queue.push(jobId);
    this.persistJobs();
    
    // Start processing if not already running
    this.processNext();
    
    return job;
  }

  async processNext() {
    if (this.activeJobs >= this.maxConcurrentJobs || this.queue.length === 0) {
      return;
    }

    const jobId = this.queue.shift();
    const job = this.jobs.get(jobId);
    
    if (!job) return;

    this.activeJobs++;
    job.status = 'processing';
    job.startedAt = new Date();
    this.persistJobs();

    try {
      await this.processJob(job);
      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date();
      console.error(`Job ${jobId} failed:`, error);
    } finally {
      this.activeJobs--;
      this.persistJobs();
      // Process next job in queue
      this.processNext();
    }
  }

  async processJob(job) {
    const { fileId, fileName } = job;
    
    console.log(`Processing job ${job.jobId} for file ${fileId}`);
    
    const s3Response = await getFileFromS3(fileId);
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(config.TEMP_DIR)) {
      fs.mkdirSync(config.TEMP_DIR, { recursive: true });
    }
    
    const tempFile = path.join(config.TEMP_DIR, `${fileId}.txt`);
    
    fs.writeFileSync(tempFile, s3Response.Body);
    console.log(`File saved to temp location: ${tempFile}`);

    const client = new MongoClient(config.MONGO_URI);
    
    try {
      await client.connect();
      console.log('Connected to MongoDB');
      
      const db = client.db(config.DB_NAME);
      const collection = db.collection('file_data');

      let batch = [];
      let lineNumber = 0;
      let errorCount = 0;

      const fileStream = createReadStream(tempFile, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        lineNumber++;
        
        // Skip empty lines
        if (!line.trim()) {
          continue;
        }
        
        try {
          let document;
          
          if (line.trim().startsWith('{')) {
            document = JSON.parse(line);
          } else {
            const parts = line.split(/\t|,/);
            document = {
              rawLine: line,
              parts: parts,
              lineNumber: lineNumber
            };
          }
          
          document.fileId = fileId;
          document.fileName = fileName;
          document.processedAt = new Date();
          
          batch.push(document);
          
          if (batch.length >= this.batchSize) {
            await collection.insertMany(batch, { ordered: false });
            job.linesProcessed += batch.length;
            job.progress = Math.min(99, Math.round((lineNumber / 100000) * 100));
            this.persistJobs(); // Update progress
            console.log(`Processed ${job.linesProcessed} lines so far...`);
            batch = [];
          }
        } catch (error) {
          errorCount++;
          job.errors.push({
            line: lineNumber,
            error: error.message,
            content: line.substring(0, 100)
          });
          
          if (errorCount > 100) {
            job.errors = job.errors.slice(0, 100); // Keep only first 100 errors
          }
        }
      }

      // Insert remaining batch
      if (batch.length > 0) {
        await collection.insertMany(batch, { ordered: false });
        job.linesProcessed += batch.length;
      }

      job.progress = 100;
      console.log(`Job ${job.jobId} completed. Processed ${job.linesProcessed} lines with ${errorCount} errors.`);
      
    } finally {
      await client.close();
      console.log('MongoDB connection closed');
      
      // Clean temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
        console.log(`Temp file deleted: ${tempFile}`);
      }
    }
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  getAllJobs() {
    return Array.from(this.jobs.values());
  }
}

const jobQueue = new JobQueue();

module.exports = jobQueue;