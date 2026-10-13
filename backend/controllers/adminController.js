const { pool } = require('../config/database');

exports.getDemandes = async (req, res) => {
    try {
        const [credits] = await pool.promise().query(
            `SELECT dc.*, tc.nom_type, u.nom, u.prenom, u.email, u.telephone
             FROM demande_credit dc
             JOIN type_credit tc ON dc.id_type = tc.id_type
             JOIN utilisateur u ON dc.id_utilisateur = u.id_utilisateur
             ORDER BY dc.date_demande DESC`
        );
        const [epargnes] = await pool.promise().query(
            `SELECT de.*, u.nom, u.prenom, u.email, u.telephone
             FROM demande_epargne de
             JOIN utilisateur u ON de.id_utilisateur = u.id_utilisateur
             ORDER BY de.date_demande DESC`
        );
        res.json({ credits, epargnes });
    } catch (e) { res.status(500).json({ message: 'Erreur.' }); }
};

exports.getStats = async (req, res) => {
    try {
        const [[membres]] = await pool.promise().query(
            'SELECT COUNT(*) AS total FROM utilisateur WHERE role = "membre"'
        );
        const [credits] = await pool.promise().query(
            'SELECT statut, COUNT(*) AS count FROM demande_credit GROUP BY statut'
        );
        const [epargnes] = await pool.promise().query(
            'SELECT statut, COUNT(*) AS count FROM demande_epargne GROUP BY statut'
        );
        const [[totalC]] = await pool.promise().query(
            'SELECT SUM(montant) AS total FROM demande_credit'
        );
        const [[totalE]] = await pool.promise().query(
            'SELECT SUM(montant_initial) AS total FROM demande_epargne'
        );

        res.json({
            total_membres: membres.total,
            credits, epargnes,
            total_credits: totalC.total || 0,
            total_epargnes: totalE.total || 0
        });
    } catch (e) { res.status(500).json({ message: 'Erreur.' }); }
};

exports.changerStatutEpargne = async (req, res) => {
    try {
        const { id_demande } = req.params;
        const { statut } = req.body;
        const valid = ['en_attente', 'ouverte', 'cloturee'];
        if (!valid.includes(statut)) return res.status(400).json({ message: 'Statut invalide.' });

        const [demande] = await pool.promise().query(
            'SELECT id_utilisateur FROM demande_epargne WHERE id_demande = ?',
            [id_demande]
        );

        await pool.promise().query(
            'UPDATE demande_epargne SET statut = ? WHERE id_demande = ?', [statut, id_demande]
        );

        const io = req.app.get('io');
        if (demande.length) {
            const userId = demande[0].id_utilisateur;
            const messages = {
                ouverte: '🎉 Votre compte épargne est ouvert ! Récupérez votre carnet à l\'agence.',
                cloturee: '🔒 Votre compte épargne a été clôturé.'
            };
            io.to(`user-${userId}`).emit('notif', {
                type: 'epargne',
                statut,
                message: messages[statut] || `Statut : ${statut}`,
                id_demande
            });
        }

        res.json({ message: '✅ Statut mis à jour.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};
exports.changerStatutCredit = async (req, res) => {
    try {
        const { id_demande } = req.params;
        const { statut } = req.body;
        const valid = ['en_attente', 'en_cours', 'approuve', 'refuse'];
        if (!valid.includes(statut)) return res.status(400).json({ message: 'Statut invalide.' });

        const [demande] = await pool.promise().query(
            'SELECT id_utilisateur FROM demande_credit WHERE id_demande = ?',
            [id_demande]
        );

        await pool.promise().query(
            'UPDATE demande_credit SET statut = ?, date_traitement = NOW() WHERE id_demande = ?',
            [statut, id_demande]
        );

        const io = req.app.get('io');
        if (demande.length) {
            const userId = demande[0].id_utilisateur;
            const messages = {
                approuve: '🎉 Félicitations ! Votre demande de crédit a été approuvée.',
                refuse: '❌ Votre demande de crédit a été refusée.',
                en_cours: '⏳ Votre demande de crédit est en cours d\'instruction.'
            };
            io.to(`user-${userId}`).emit('notif', {
                type: 'credit',
                statut,
                message: messages[statut] || `Statut : ${statut}`,
                id_demande
            });
        }

        res.json({ message: '✅ Statut mis à jour.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};
exports.getPiecesJointes = async (req, res) => {
    try {
        const { type, id } = req.params;
        const [pieces] = await pool.promise().query(
            'SELECT * FROM pieces_jointes WHERE type_demande = ? AND id_demande = ?',
            [type, id]
        );
        res.json({ pieces });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};