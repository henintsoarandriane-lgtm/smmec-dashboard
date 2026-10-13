const express = require('express');
const router = express.Router();
const c = require('../controllers/creditController');
const { authMiddleware } = require('../middleware/auth');

router.post('/simuler', c.simulerCredit);
router.post('/soumettre', authMiddleware, c.soumettreCredit);
router.get('/historique', authMiddleware, c.getHistorique);

module.exports = router;