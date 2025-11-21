const jobQueue = require('../services/jobQueue');

const healthCheck = (req, res) => {
  console.log('health check');
  res.json({ 
    status: 'healthy',
    timestamp: new Date(),
    activeJobs: jobQueue.activeJobs,
    queuedJobs: jobQueue.queue.length
  });
};

module.exports = {
  healthCheck
};