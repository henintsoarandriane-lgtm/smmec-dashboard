const express = require('express');
const router = express.Router();
const c = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', c.register);
router.post('/login', c.login);
router.get('/profile', authMiddleware, c.getProfile);

module.exports = router;