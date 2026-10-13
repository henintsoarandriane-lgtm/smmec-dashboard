const express = require('express');
const router = express.Router();
const c = require('../controllers/tauxController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public
router.get('/credit', c.getTauxCredit);
router.get('/epargne', c.getTauxEpargne);

// Admin uniquement
router.put('/credit/:id_type', authMiddleware, adminMiddleware, c.modifierTauxCredit);
router.put('/epargne/:id_taux', authMiddleware, adminMiddleware, c.modifierTauxEpargne);
router.get('/historique', authMiddleware, adminMiddleware, c.getHistoriqueTaux);

module.exports = router;