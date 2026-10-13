const express = require('express');
const router = express.Router();
const c = require('../controllers/epargneController');
const { authMiddleware } = require('../middleware/auth');

router.post('/soumettre', authMiddleware, c.soumettreEpargne);

module.exports = router;