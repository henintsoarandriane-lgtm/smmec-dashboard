// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// ==========================================
// INSCRIPTION
// ==========================================
exports.register = async (req, res) => {
    try {
        const { nom, prenom, email, telephone, mot_de_passe } = req.body;
        if (!nom || !prenom || !email || !telephone || !mot_de_passe)
            return res.status(400).json({ message: 'Tous les champs sont requis.' });

        const [exist] = await pool.promise().query(
            'SELECT id_utilisateur FROM utilisateur WHERE email = ?', [email]
        );
        if (exist.length) return res.status(400).json({ message: 'Email déjà utilisé.' });

        const hash = await bcrypt.hash(mot_de_passe, 10);
        const [r] = await pool.promise().query(
            `INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe, role, authority_level)
             VALUES (?, ?, ?, ?, ?, 'membre', 20)`,
            [nom, prenom, email, telephone, hash]
        );

        res.status(201).json({ message: '✅ Inscription réussie !', id_utilisateur: r.insertId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur inscription.' });
    }
};

// ==========================================
// CONNEXION
// ==========================================
exports.login = async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;
        if (!email || !mot_de_passe)
            return res.status(400).json({ message: 'Champs requis.' });

        const [rows] = await pool.promise().query(
            'SELECT * FROM utilisateur WHERE email = ?', [email]
        );
        if (!rows.length) return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });

        const user = rows[0];
        const ok = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!ok) return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });

        // ==========================================
        // GÉNÉRATION DU JWT AVEC authority_level
        // ==========================================
        const token = jwt.sign(
            { 
                id_utilisateur: user.id_utilisateur, 
                role: user.role,
                authority_level: user.authority_level || 20,
                id_service: user.id_service
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        // ==========================================
        // RÉPONSE
        // ==========================================
        res.json({
            message: '✅ Connexion réussie !',
            token,
            user: {
                id_utilisateur: user.id_utilisateur,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                telephone: user.telephone,
                role: user.role,
                authority_level: user.authority_level || 20,
                id_service: user.id_service,
                date_inscription: user.date_inscription
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur connexion.' });
    }
};

// ==========================================
// PROFIL
// ==========================================
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await pool.promise().query(
            `SELECT id_utilisateur, nom, prenom, email, telephone, role, 
                    authority_level, id_service, date_inscription
             FROM utilisateur WHERE id_utilisateur = ?`, 
            [req.user.id_utilisateur]
        );
        if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable.' });
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};