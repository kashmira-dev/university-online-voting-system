const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post(['/student-login', '/student/login'], authController.studentLogin);
router.post(['/admin-login', '/admin/login'], authController.adminLogin);
router.post(['/student-register', '/register'], authController.studentRegister);
router.get('/departments', authController.getPublicDepartments);
router.get('/me', authMiddleware(), authController.getMe);

module.exports = router;