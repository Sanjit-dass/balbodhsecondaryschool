const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');

// In development or for localhost traffic, allow much higher limits to avoid blocking during local testing.
const isDev = ['development', 'test', 'local'].includes(String(process.env.NODE_ENV || '').toLowerCase());

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
};

const isLocalRequest = (req) => {
  const ip = getClientIp(req);
  return !ip || ['::1', '127.0.0.1', '0.0.0.0', '::ffff:127.0.0.1', '::ffff:0.0.0.0'].includes(ip) || ip.startsWith('::ffff:127.0.0.1');
};

const getLimiterMax = (req, fallbackMax) => {
  if (process.env.RATE_LIMIT_DISABLE === 'true') return Number.MAX_SAFE_INTEGER;
  if (process.env.RATE_LIMIT_MAX) {
    const parsed = Number(process.env.RATE_LIMIT_MAX);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  if (isLocalRequest(req) || isDev) return 5000;
  return fallbackMax;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => getLimiterMax(req, 120), // auth endpoints can drive extra calls during login / token checks
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication requests from this IP, please try again later.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => getLimiterMax(req, 250), // general API traffic gets a wider allowance
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
