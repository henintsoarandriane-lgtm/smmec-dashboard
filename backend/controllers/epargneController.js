const { pool } = require('../config/database');

exports.soumettreEpargne = async (req, res) => {
    try {
        const { type_epargne, montant_initial, versement_programme, objectif, fichiers } = req.body;
        const id = req.user.id_utilisateur;

        if (!type_epargne || !montant_initial)
            return res.status(400).json({ message: 'Type et montant requis.' });

        const [exist] = await pool.promise().query(
            'SELECT id_demande FROM demande_epargne WHERE id_utilisateur = ?', [id]
        );
        if (exist.length)
            return res.status(400).json({ message: '❌ Vous avez déjà un compte épargne.' });

        const [r] = await pool.promise().query(
            `INSERT INTO demande_epargne (id_utilisateur, type_epargne, montant_initial, versement_programme, objectif)
             VALUES (?, ?, ?, ?, ?)`,
            [id, type_epargne, montant_initial, versement_programme || null, objectif || null]
        );

        if (fichiers && Array.isArray(fichiers) && fichiers.length) {
            for (const f of fichiers) {
                await pool.promise().query(
                    `INSERT INTO pieces_jointes (type_demande, id_demande, nom_fichier, url, taille)
                     VALUES ('epargne', ?, ?, ?, ?)`,
                    [r.insertId, f.originalname, f.url, f.size]
                );
            }
        }

        await pool.promise().query(
            'INSERT INTO historique (id_utilisateur, action) VALUES (?, ?)',
            [id, `Demande épargne #${r.insertId}`]
        );

        const io = req.app.get('io');
        io.to('admins').emit('nouvelle-demande', {
            type: 'epargne',
            id: r.insertId,
            message: `🏦 Nouvelle demande d'épargne #${r.insertId}`,
            id_utilisateur: id
        });

        res.status(201).json({ message: '✅ Demande épargne envoyée !', id_demande: r.insertId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur.' });
    }
};