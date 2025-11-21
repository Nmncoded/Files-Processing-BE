const express = require('express');
const router = express.Router();

const uploadRoutes = require('./upload.routes');
const jobRoutes = require('./job.routes');
const healthRoutes = require('./health.routes');

// routes
router.use('/', healthRoutes);
router.use('/', uploadRoutes);
router.use('/', jobRoutes);

module.exports = router;