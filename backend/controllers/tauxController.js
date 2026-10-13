 // controllers/tauxController.js
const { pool } = require('../config/database');

// ==========================================
// TAUX DE CRÉDIT
// ==========================================

// Récupérer tous les taux de crédit
exports.getTauxCredit = async (req, res) => {
    try {
        const [taux] = await pool.promise().query(
            'SELECT * FROM type_credit ORDER BY id_type'
        );
        res.json({ taux });
    } catch (e) {
        res.status(500).json({ message: 'Erreur.' });
    }
};

// Modifier le taux d'un type de crédit
exports.modifierTauxCredit = async (req, res) => {
    try {
        const { id_type } = req.params;
        const { taux_annuel } = req.body;
        const id_utilisateur = req.user.id_utilisateur;

        if (!taux_annuel || taux_annuel < 0 || taux_annuel > 50) {
            return res.status(400).json({ message: 'Taux invalide (0-50%).' });
        }

        // Récupérer l'ancien taux
        const [ancien] = await pool.promise().query(
            'SELECT taux_annuel FROM type_credit WHERE id_type = ?', [id_type]
        );
        if (!ancien.length) return res.status(404).json({ message: 'Type inconnu.' });

        // Mettre à jour
        await pool.promise().query(
            'UPDATE type_credit SET taux_annuel = ? WHERE id_type = ?',
            [taux_annuel, id_type]
        );

        // Log
        await pool.promise().query(
            `INSERT INTO log_taux (type_element, id_element, ancien_taux, nouveau_taux, id_utilisateur)
             VALUES ('credit', ?, ?, ?, ?)`,
            [id_type, ancien[0].taux_annuel, taux_annuel, id_utilisateur]
        );

        res.json({ message: '✅ Taux modifié.', ancien: ancien[0].taux_annuel, nouveau: taux_annuel });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};

// ==========================================
// TAUX D'ÉPARGNE
// ==========================================

exports.getTauxEpargne = async (req, res) => {
    try {
        const [taux] = await pool.promise().query(
            'SELECT * FROM taux_epargne ORDER BY type_epargne'
        );
        res.json({ taux });
    } catch (e) {
        res.status(500).json({ message: 'Erreur.' });
    }
};

exports.modifierTauxEpargne = async (req, res) => {
    try {
        const { id_taux } = req.params;
        const { taux_annuel } = req.body;
        const id_utilisateur = req.user.id_utilisateur;

        if (!taux_annuel || taux_annuel < 0 || taux_annuel > 20) {
            return res.status(400).json({ message: 'Taux invalide (0-20%).' });
        }

        const [ancien] = await pool.promise().query(
            'SELECT taux_annuel FROM taux_epargne WHERE id_taux = ?', [id_taux]
        );
        if (!ancien.length) return res.status(404).json({ message: 'Type inconnu.' });

        await pool.promise().query(
            'UPDATE taux_epargne SET taux_annuel = ?, date_modification = NOW(), id_modificateur = ? WHERE id_taux = ?',
            [taux_annuel, id_utilisateur, id_taux]
        );

        await pool.promise().query(
            `INSERT INTO log_taux (type_element, id_element, ancien_taux, nouveau_taux, id_utilisateur)
             VALUES ('epargne', ?, ?, ?, ?)`,
            [id_taux, ancien[0].taux_annuel, taux_annuel, id_utilisateur]
        );

        res.json({ message: '✅ Taux modifié.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};

// Historique des modifications
exports.getHistoriqueTaux = async (req, res) => {
    try {
        const [logs] = await pool.promise().query(
            `SELECT lt.*, u.nom, u.prenom
             FROM log_taux lt
             JOIN utilisateur u ON lt.id_utilisateur = u.id_utilisateur
             ORDER BY lt.date_modification DESC LIMIT 50`
        );
        res.json({ logs });
    } catch (e) {
        res.status(500).json({ message: 'Erreur.' });
    }
};