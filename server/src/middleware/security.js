const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');

// In development allow much higher limits to avoid blocking during local testing.
const isDev = process.env.NODE_ENV === 'development';
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 120, // auth endpoints can drive extra calls during login / token checks
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication requests from this IP, please try again later.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 250, // general API traffic gets a wider allowance
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' }
});

module.exports = function(app){
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "http:"],
        frameSrc: ["'self'", "https:", "http:"],
        frameAncestors: ["'self'", "https:", "http:"], // Allow framing from localhost
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  app.use(mongoSanitize());
  app.use(xssClean());
  app.use(hpp());
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) {
      return authLimiter(req, res, next);
    }
    return generalLimiter(req, res, next);
  });
};
