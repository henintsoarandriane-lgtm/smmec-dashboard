// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, upload.array('fichiers', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Aucun fichier envoyé.' });
        }
        const files = req.files.map(f => ({
            filename: f.filename,
            originalname: f.originalname,
            size: f.size,
            url: `/uploads/${f.filename}`
        }));
        res.json({ message: '✅ Fichiers uploadés !', files });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur upload.' });
    }
});

module.exports = router;