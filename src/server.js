const express = require('express');
const config = require('./config/config');
const routes = require('./routes');

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
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, saving job state...');
  process.exit(0);
});

module.exports = app;