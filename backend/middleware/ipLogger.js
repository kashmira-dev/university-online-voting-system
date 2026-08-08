// Middleware to extract client IP address
const ipLogger = (req, res, next) => {
  let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
  if (clientIp.includes('::ffff:')) {
    clientIp = clientIp.replace('::ffff:', '');
  }
  if (clientIp === '::1') {
    clientIp = '127.0.0.1';
  }
  req.clientIp = clientIp;
  next();
};

module.exports = ipLogger;