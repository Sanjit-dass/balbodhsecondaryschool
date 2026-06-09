const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    // log truncated token and error for debugging (do not log full secret or sensitive data)
    try {
      const preview = String(token).slice(0, 20) + (String(token).length > 20 ? '...' : '');
      console.warn('Auth failed for token starting:', preview, 'error:', err.message || err);
    } catch (logErr) {
      console.warn('Auth failed and token preview unavailable', err.message || err);
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};
