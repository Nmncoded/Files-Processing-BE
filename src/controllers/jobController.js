const { v4: uuidv4 } = require("uuid");
const jobQueue = require("../services/jobQueue");

const processFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { fileName } = req.body;

    const jobId = uuidv4();
    const job = jobQueue.enqueue(jobId, fileId, fileName || fileId);

    res.json({
      success: true,
      jobId,
      fileId,
      status: job.status,
      message: "Processing job enqueued",
      checkStatusAt: `/job/${jobId}`,
    });
  } catch (error) {
    console.error("Process error:", error);
    res.status(500).json({
      error: "Failed to enqueue processing job",
      details: error.message,
    });
  }
};

const getJobStatus = (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({
      jobId: job.jobId,
      fileId: job.fileId,
      fileName: job.fileName,
      status: job.status,
      progress: job.progress,
      linesProcessed: job.linesProcessed,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      error: job.error,
      errorCount: job.errors.length,
      recentErrors: job.errors.slice(0, 10), // Show first 10 errors
    });
  } catch (error) {
    console.error("getJobStatus error:", error);
    res.status(500).json({
      error: "Failed to get job status",
      details: error.message,
    });
  }
};

const getAllJobs = (req, res) => {
  try {
    const jobs = jobQueue.getAllJobs().map((job) => ({
      jobId: job.jobId,
      fileId: job.fileId,
      fileName: job.fileName,
      status: job.status,
      linesProcessed: job.linesProcessed,
      createdAt: job.createdAt,
    }));

    res.json({
      total: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("getAllJobs error:", error);
    res.status(500).json({
      error: "Failed to get all jobs",
      details: error.message,
    });
  }
};

module.exports = {
  processFile,
  getJobStatus,
  getAllJobs,
};
