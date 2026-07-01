const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ResetToken = require('../models/ResetToken');
const cloudinary = require('../utils/cloudinary');
const { extractCloudinaryPublicId, getCloudinaryResourceType } = require('../utils/cloudinaryHelpers');

function signAccessToken(user) {
  return jwt.sign({ user: { id: user.id, role: user.role } }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
}

function signRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function saveRefreshToken({ user, token, ipAddress, device }) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user, token, expiresAt, ipAddress, device });
  return token;
}

async function register(req, res) {
  res.status(403).json({ message: 'Public registration is disabled. Only administrators can create user accounts.' });
}

async function createUser(req, res) {
  const { name, email, password, role } = req.body;
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const newRole = role ? String(role).toLowerCase() : 'student';
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: normalizedEmail, password: hashedPassword, role: newRole });

    if (newRole === 'student') {
      const Student = require('../models/Student');
      await Student.create({
        fullName: name,
        email: normalizedEmail,
        user: user._id,
        admissionNumber: 'STU' + Date.now().toString().slice(-6)
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  const { email, password, role } = req.body;
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const requestedRole = role ? String(role).trim().toLowerCase() : null;
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    if (requestedRole && requestedRole !== user.role) {
      return res.status(403).json({ message: 'Access denied. This account does not belong to the selected portal.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not active. Contact the administrator.' });
    }

    // Auto-create Student record if student user doesn't have one
    if (user.role === 'student') {
      const Student = require('../models/Student');
      const existingStudent = await Student.findOne({ user: user._id });
      if (!existingStudent) {
        await Student.create({
          fullName: user.name,
          email: user.email,
          user: user._id,
          admissionNumber: 'STU' + Date.now().toString().slice(-6)
        });
      }
    }

    const token = signAccessToken(user);
    const refreshTokenValue = signRefreshToken();
    await saveRefreshToken({ user: user._id, token: refreshTokenValue, ipAddress: req.ip, device: req.headers['user-agent'] });

    res.json({ token, refreshToken: refreshTokenValue, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateProfile(req, res) {
  const { email, password, currentPassword, name, profile = {} } = req.body;
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      user.email = normalizedEmail;
    }

    if (name) {
      user.name = name;
    }

    const oldPhotoUrl = user.profile?.photoUrl;
    if (profile.phone !== undefined) {
      user.profile.phone = profile.phone;
    }
    if (profile.address !== undefined) {
      user.profile.address = profile.address;
    }
    if (profile.department !== undefined) {
      user.profile.department = profile.department;
    }
    if (profile.designation !== undefined) {
      user.profile.designation = profile.designation;
    }
    if (profile.photoUrl !== undefined) {
      if (profile.photoUrl === null || profile.photoUrl === '') {
        if (oldPhotoUrl) {
          const publicId = extractCloudinaryPublicId(oldPhotoUrl);
          const resourceType = oldPhotoUrl ? getCloudinaryResourceType(oldPhotoUrl) : 'auto';
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            } catch (destroyErr) {
              console.error('Failed to delete profile photo from Cloudinary', destroyErr);
            }
          }
        }
        user.profile.photoUrl = '';
      } else {
        if (oldPhotoUrl && oldPhotoUrl !== profile.photoUrl) {
          const publicId = extractCloudinaryPublicId(oldPhotoUrl);
          const resourceType = publicId ? getCloudinaryResourceType(oldPhotoUrl) : 'auto';
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            } catch (destroyErr) {
              console.error('Failed to delete previous profile photo from Cloudinary', destroyErr);
            }
          }
        }
        user.profile.photoUrl = profile.photoUrl;
      }
    }

    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, profile: user.profile } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }
  try {
    const stored = await RefreshToken.findOne({ token: refreshToken }).populate('user');
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh token invalid or expired' });
    }
    const accessToken = signAccessToken(stored.user);
    res.json({ token: accessToken, user: { id: stored.user.id, name: stored.user.name, email: stored.user.email, role: stored.user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function logout(req, res) {
  try {
    await RefreshToken.deleteMany({ user: req.user.id });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    const genericResponse = { message: 'If the email exists, password reset instructions will be sent.' };

    if (!user) {
      return res.json(genericResponse);
    }

    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(plainToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await ResetToken.deleteMany({ user: user._id });
    await ResetToken.create({ user: user._id, token: hashedToken, expiresAt });

    const frontendBase = (process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
    const resetLink = `${frontendBase}/reset-password/${plainToken}`;
    let response = genericResponse;

    if (process.env.EMAIL_SERVICE_HOST && process.env.EMAIL_SERVICE_USER && process.env.EMAIL_SERVICE_PASS) {
      try {
        const transporter = require('nodemailer').createTransport({
          host: process.env.EMAIL_SERVICE_HOST,
          port: process.env.EMAIL_SERVICE_PORT || 587,
          secure: process.env.EMAIL_SERVICE_SECURE === 'true',
          auth: { user: process.env.EMAIL_SERVICE_USER, pass: process.env.EMAIL_SERVICE_PASS }
        });

        await transporter.sendMail({
          from: `"Bal Bodh Sec School" <${process.env.EMAIL_SERVICE_USER}>`,
          to: user.email,
          subject: 'Bal Bodh Sec School Password Recovery',
          text: `Dear ${user.name || 'Student'},\n\nYou have requested a password reset for your Bal Bodh Sec School account. Please use the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for 15 minutes. If you did not request this password reset, please ignore this email or contact the school administrator immediately.\n\nThank you,\nBal Bodh Sec School Support Team`,
          html: `<p>Dear ${user.name || 'Student'},</p><p>You have requested a password reset for your <strong>Bal Bodh Sec School</strong> account. Please use the link below to set a new password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link is valid for 15 minutes. If you did not request this password reset, please ignore this email or contact the school administrator immediately.</p><p>Thank you,<br/>Bal Bodh Sec School Support Team</p>`
        });
      } catch (sendError) {
        console.error('Failed to send password reset email', sendError);
        if (process.env.NODE_ENV !== 'production') {
          response = {
            message: 'Unable to send reset email. Use the link below to reset your password.',
            resetLink
          };
        }
      }
    } else {
      console.warn(`Password reset link for ${normalizedEmail}: ${resetLink}`);
      if (process.env.NODE_ENV !== 'production') {
        response = {
          message: 'Password reset email is not configured. Use the link below to reset your password.',
          resetLink
        };
      }
    }

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function validateResetToken(req, res) {
  try {
    const { token } = req.params;
    const hashedToken = hashToken(String(token || ''));
    const rt = await ResetToken.findOne({ token: hashedToken });
    if (!rt || rt.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }
    return res.json({ valid: true, message: 'Password reset token is valid. You may choose a new password.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = hashToken(String(token || ''));

    const rt = await ResetToken.findOne({ token: hashedToken });
    if (!rt || rt.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    const user = await User.findById(rt.user).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await ResetToken.deleteMany({ user: user._id });

    return res.json({ message: 'Your password has been reset successfully. Please log in with your new password.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, createUser, login, updateProfile, refresh, logout, me, forgotPassword, validateResetToken, resetPassword };
