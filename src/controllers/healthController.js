
const healthCheck = (req, res) => {
  console.log('health check');
  res.json({ 
    status: 'healthy',
    timestamp: new Date(),
  });
};

module.exports = {
  healthCheck
};