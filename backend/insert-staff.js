const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

(async () => {
    console.log('\n🚀 Création des comptes du personnel SMMEC...\n');

    const comptes = [
        { nom: 'Rakoto', prenom: 'Directeur', email: 'directeur@smmec.mg', role: 'admin', id_service: 1 },
        { nom: 'Rasoa', prenom: 'CSED', email: 'csed@smmec.mg', role: 'admin', id_service: 2 },
        { nom: 'Rabe', prenom: 'CSAF', email: 'csaf@smmec.mg', role: 'admin', id_service: 3 },
        { nom: 'Ranaivo', prenom: 'Conseiller', email: 'conseiller@smmec.mg', role: 'admin', id_service: 4 },
        { nom: 'Randria', prenom: 'Caissier', email: 'caissier@smmec.mg', role: 'admin', id_service: 5 },
        { nom: 'Rakoto', prenom: 'Agent', email: 'agent@smmec.mg', role: 'admin', id_service: 6 }
    ];

    for (const c of comptes) {
        try {
            const [exist] = await pool.promise().query(
                'SELECT id_utilisateur FROM utilisateur WHERE email = ?', [c.email]
            );

            if (exist.length) {
                console.log('⏭️  Déjà existant :', c.email);
                continue;
            }

            const hash = await bcrypt.hash('smmec123', 10);

            const [service] = await pool.promise().query(
                'SELECT authority_level FROM service WHERE id_service = ?', [c.id_service]
            );

            if (!service.length) {
                console.log('❌ Service introuvable pour', c.email);
                continue;
            }

            const [r] = await pool.promise().query(
                `INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe, role, authority_level, id_service)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [c.nom, c.prenom, c.email, '0340000000', hash, c.role, service[0].authority_level, c.id_service]
            );

            console.log('✅ Créé :', c.email, '(ID ' + r.insertId + ', niveau ' + service[0].authority_level + ')');
        } catch (err) {
            console.log('❌ Erreur', c.email, ':', err.message);
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 COMPTES DE TEST :');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('directeur@smmec.mg    / smmec123  (Niveau 100)');
    console.log('csed@smmec.mg         / smmec123  (Niveau 80)');
    console.log('csaf@smmec.mg         / smmec123  (Niveau 80)');
    console.log('conseiller@smmec.mg   / smmec123  (Niveau 50)');
    console.log('caissier@smmec.mg     / smmec123  (Niveau 50)');
    console.log('agent@smmec.mg        / smmec123  (Niveau 20)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit();
})();