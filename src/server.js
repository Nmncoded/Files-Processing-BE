const express = require('express');
require("dotenv").config();

const config = require('./config/config');
const routes = require('./routes');
const jobQueue = require('./services/jobQueue');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/', routes);

// Start server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

// shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, saving job state...');
  jobQueue.persistJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, saving job state...');
  jobQueue.persistJobs();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION', reason);
});

module.exports = app;