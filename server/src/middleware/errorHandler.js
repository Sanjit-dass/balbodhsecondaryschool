module.exports = function (err, req, res, next) {
  console.error(err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
};
