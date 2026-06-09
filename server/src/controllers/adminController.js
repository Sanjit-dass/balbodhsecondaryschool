const feeService = require('../services/feeService');
const reportService = require('../services/reportService');
const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

class AdminController {
  /**
   * POST /admin/fee-structure
   * Set or update class-wise fee structure
   */
  async createFeeStructure(req, res) {
    try {
      const { classId, academicYear, items } = req.body;

      if (!classId || !academicYear || !items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Missing fields: classId, academicYear, items (array)',
        });
      }

      const structure = await feeService.createOrUpdateFeeStructure({
        classId,
        academicYear,
        items,
      });

      res.status(201).json({
        success: true,
        message: 'Fee structure configured successfully',
        data: structure,
      });
    } catch (error) {
      console.error('Error in createFeeStructure:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /admin/reports
   * Fetch global income, class-wise revenue, monthly stats, and category breakdowns
   */
  async getReports(req, res) {
    try {
      const { academicYear } = req.query;

      const [globalSummary, classRevenue, monthlyIncome, categoryBreakdown] = await Promise.all([
        reportService.getGlobalSummary(academicYear),
        reportService.getClassWiseRevenue(academicYear),
        reportService.getMonthlyIncome(academicYear),
        reportService.getFeeCategoryBreakdown(academicYear),
      ]);

      res.status(200).json({
        success: true,
        data: {
          globalSummary,
          classRevenue,
          monthlyIncome,
          categoryBreakdown,
        },
      });
    } catch (error) {
      console.error('Error in getReports:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /admin/users
   * Create admin, accountant, or student user and assign roles
   */
  async manageUsers(req, res) {
    try {
      const { name, email, password, role, classId, admissionNumber } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Missing fields: name, email, password, role',
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: String(role).toLowerCase(),
      });
      await user.save();

      // If user is a student, also create the Student profile record
      if (user.role === 'student') {
        const student = new Student({
          fullName: name,
          email: normalizedEmail,
          user: user._id,
          class: classId || null,
          admissionNumber: admissionNumber || 'STU' + Date.now().toString().slice(-6),
          status: 'active',
        });
        await student.save();
      }

      res.status(201).json({
        success: true,
        message: `${role.toUpperCase()} user created successfully`,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error in manageUsers:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AdminController();
