// controllers/hierarchyController.js
const { pool } = require('../config/database');

// Vérifier si un utilisateur peut voir un autre utilisateur
exports.peutVoir = (monNiveau, cibleNiveau) => {
    return monNiveau > cibleNiveau;
};

// Récupérer le personnel visible selon mon niveau
exports.getPersonnel = async (req, res) => {
    try {
        const monNiveau = req.user.authority_level;
        const monId = req.user.id_utilisateur;

        const [personnel] = await pool.promise().query(
            `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, 
                    u.role, u.authority_level, u.date_inscription,
                    s.nom_service
             FROM utilisateur u
             LEFT JOIN service s ON u.id_service = s.id_service
             WHERE u.authority_level < ? AND u.id_utilisateur != ?
             ORDER BY u.authority_level DESC`,
            [monNiveau, monId]
        );

        res.json({ personnel });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};

// Créer un nouveau membre du personnel (réservé aux chefs)
exports.creerPersonnel = async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { nom, prenom, email, telephone, mot_de_passe, role, id_service } = req.body;

        const monNiveau = req.user.authority_level;

        // Récupérer le niveau du rôle à créer
        const [services] = await pool.promise().query(
            'SELECT authority_level FROM service WHERE id_service = ?', [id_service]
        );

        if (!services.length) return res.status(404).json({ message: 'Service inconnu.' });

        const niveauCible = services[0].authority_level;

        // Vérifier que je peux créer ce niveau
        if (niveauCible >= monNiveau) {
            return res.status(403).json({ message: '⛔ Vous ne pouvez pas créer ce niveau.' });
        }

        const hash = await bcrypt.hash(mot_de_passe, 10);

        const [r] = await pool.promise().query(
            `INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe, role, authority_level, id_service)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nom, prenom, email, telephone, hash, role, niveauCible, id_service]
        );

        res.status(201).json({ message: '✅ Personnel créé.', id: r.insertId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};

// Modifier le niveau d'un membre du personnel
exports.modifierPersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_service, role } = req.body;
        const monNiveau = req.user.authority_level;

        const [cible] = await pool.promise().query(
            'SELECT authority_level FROM utilisateur WHERE id_utilisateur = ?', [id]
        );

        if (!cible.length) return res.status(404).json({ message: 'Introuvable.' });
        if (cible[0].authority_level >= monNiveau) {
            return res.status(403).json({ message: '⛔ Accès refusé.' });
        }

        const [services] = await pool.promise().query(
            'SELECT authority_level FROM service WHERE id_service = ?', [id_service]
        );
        if (!services.length) return res.status(404).json({ message: 'Service inconnu.' });

        if (services[0].authority_level >= monNiveau) {
            return res.status(403).json({ message: '⛔ Niveau non autorisé.' });
        }

        await pool.promise().query(
            'UPDATE utilisateur SET id_service = ?, role = ?, authority_level = ? WHERE id_utilisateur = ?',
            [id_service, role, services[0].authority_level, id]
        );

        res.json({ message: '✅ Modifié.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};

// Supprimer un membre du personnel
exports.supprimerPersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        const monNiveau = req.user.authority_level;

        const [cible] = await pool.promise().query(
            'SELECT authority_level FROM utilisateur WHERE id_utilisateur = ?', [id]
        );

        if (!cible.length) return res.status(404).json({ message: 'Introuvable.' });
        if (cible[0].authority_level >= monNiveau) {
            return res.status(403).json({ message: '⛔ Accès refusé.' });
        }

        await pool.promise().query('DELETE FROM utilisateur WHERE id_utilisateur = ?', [id]);
        res.json({ message: '✅ Supprimé.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};

// Récupérer la liste des services
exports.getServices = async (req, res) => {
    try {
        const [services] = await pool.promise().query(
            'SELECT * FROM service ORDER BY authority_level DESC'
        );
        res.json({ services });
    } catch (e) {
        res.status(500).json({ message: 'Erreur.' });
    }
};