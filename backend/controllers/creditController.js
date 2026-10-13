const { pool } = require('../config/database');

exports.soumettreCredit = async (req, res) => {
    try {
        const { id_type, montant, duree_mois, motif, fichiers } = req.body;
        const id_utilisateur = req.user.id_utilisateur;

        if (!id_type || !montant || !duree_mois || !motif)
            return res.status(400).json({ message: 'Champs requis.' });

        const [types] = await pool.promise().query(
            'SELECT * FROM type_credit WHERE id_type = ?', [id_type]
        );
        if (!types.length) return res.status(404).json({ message: 'Type inconnu.' });

        const t = types[0];
        if (montant > t.montant_max) return res.status(400).json({ message: `Max ${t.montant_max} Ar` });
        if (duree_mois > t.duree_max) return res.status(400).json({ message: `Max ${t.duree_max} mois` });

        const tm = (t.taux_annuel / 100) / 12;
        const mensualite = montant * (tm * Math.pow(1 + tm, duree_mois)) /
                           (Math.pow(1 + tm, duree_mois) - 1);

        const [r] = await pool.promise().query(
            `INSERT INTO demande_credit (id_utilisateur, id_type, montant, duree_mois, mensualite, motif)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id_utilisateur, id_type, montant, duree_mois, Math.round(mensualite * 100) / 100, motif]
        );

        // Pièces jointes
        if (fichiers && Array.isArray(fichiers) && fichiers.length) {
            for (const f of fichiers) {
                await pool.promise().query(
                    `INSERT INTO pieces_jointes (type_demande, id_demande, nom_fichier, url, taille)
                     VALUES ('credit', ?, ?, ?, ?)`,
                    [r.insertId, f.originalname, f.url, f.size]
                );
            }
        }

        await pool.promise().query(
            'INSERT INTO historique (id_utilisateur, action) VALUES (?, ?)',
            [id_utilisateur, `Demande crédit #${r.insertId}`]
        );

        // SOCKET
        const io = req.app.get('io');
        io.to('admins').emit('nouvelle-demande', {
            type: 'credit',
            id: r.insertId,
            message: `💰 Nouvelle demande de crédit #${r.insertId}`,
            montant,
            id_utilisateur
        });

        res.status(201).json({
            message: '✅ Demande envoyée !',
            id_demande: r.insertId,
            mensualite: Math.round(mensualite * 100) / 100,
            statut: 'en_attente'
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur soumission.' });
    }
};
exports.simulerCredit = async (req, res) => {
    try {
        const { montant, duree_mois, taux_annuel } = req.body;
        if (!montant || !duree_mois || !taux_annuel)
            return res.status(400).json({ message: 'Champs requis.' });

        const tm = (taux_annuel / 100) / 12;
        const mensualite = montant * (tm * Math.pow(1 + tm, duree_mois)) /
                           (Math.pow(1 + tm, duree_mois) - 1);
        const total = mensualite * duree_mois;

        res.json({
            mensualite: Math.round(mensualite * 100) / 100,
            total_rembourse: Math.round(total * 100) / 100,
            interets: Math.round((total - montant) * 100) / 100
        });
    } catch (e) { res.status(500).json({ message: 'Erreur simulation.' }); }
};


exports.getHistorique = async (req, res) => {
    try {
        const id = req.user.id_utilisateur;
        const [credits] = await pool.promise().query(
            `SELECT dc.*, tc.nom_type FROM demande_credit dc
             JOIN type_credit tc ON dc.id_type = tc.id_type
             WHERE dc.id_utilisateur = ? ORDER BY dc.date_demande DESC`, [id]
        );
        const [epargnes] = await pool.promise().query(
            'SELECT * FROM demande_epargne WHERE id_utilisateur = ? ORDER BY date_demande DESC', [id]
        );
        res.json({ credits, epargnes });
    } catch (e) { res.status(500).json({ message: 'Erreur.' }); }
};