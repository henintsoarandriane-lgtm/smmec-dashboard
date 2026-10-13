const express = require('express');
const router = express.Router();
const c = require('../controllers/hierarchyController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/personnel', c.getPersonnel);
router.post('/personnel', c.creerPersonnel);
router.put('/personnel/:id', c.modifierPersonnel);
router.delete('/personnel/:id', c.supprimerPersonnel);
router.get('/services', c.getServices);

module.exports = router;