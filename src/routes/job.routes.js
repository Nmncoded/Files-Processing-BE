const express = require('express');
const router = express.Router();
const { processFile, getJobStatus, getAllJobs } = require('../controllers/jobController');

// Enqueue processing job
router.post('/process/:fileId', processFile);

router.get('/job/:jobId', getJobStatus);

router.get('/jobs', getAllJobs);

module.exports = router;