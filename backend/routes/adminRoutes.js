const express = require('express');
const router = express.Router();
const c = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);
router.get('/demandes', c.getDemandes);
router.get('/stats', c.getStats);
router.put('/credit/:id_demande', c.changerStatutCredit);
router.put('/epargne/:id_demande', c.changerStatutEpargne);
router.get('/pieces/:type/:id', c.getPiecesJointes);

module.exports = router;