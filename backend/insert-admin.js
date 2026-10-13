const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

(async () => {
    console.log('\n🚀 Démarrage de la création d\'admin...\n');

    // ==========================================
    // PARAMÈTRES À MODIFIER
    // ==========================================
    const nom = 'Admin';
    const prenom = 'SMMEC';
    const email = 'admin@smmec.mg';
    const telephone = '0330000000';
    const motDePasse = 'Admin2026!';      // ⚠️ Modifiez si vous voulez
    const role = 'admin';

    try {
        // 1. Supprimer l'ancien compte s'il existe
        console.log('🗑️  Suppression de l\'ancien compte...');
        await pool.promise().query('DELETE FROM utilisateur WHERE email = ?', [email]);

        // 2. Hacher le mot de passe
        console.log('🔐 Génération du hash bcrypt...');
        const hash = await bcrypt.hash(motDePasse, 10);
        console.log('📏 Longueur du hash :', hash.length, 'caractères');
        console.log('📋 Hash :', hash);

        // 3. Insérer dans la base
        console.log('\n💾 Insertion dans la base de données...');
        const [r] = await pool.promise().query(
            `INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe, role)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nom, prenom, email, telephone, hash, role]
        );

        // 4. Vérifier
        const [verif] = await pool.promise().query(
            'SELECT email, role, LENGTH(mot_de_passe) AS len FROM utilisateur WHERE id_utilisateur = ?',
            [r.insertId]
        );

        console.log('\n========================================');
        console.log('✅ ADMIN CRÉÉ AVEC SUCCÈS !');
        console.log('========================================');
        console.log('📧 Email     :', email);
        console.log('🔑 Mot passe :', motDePasse);
        console.log('👤 Rôle      :', verif[0].role);
        console.log('📏 Hash len  :', verif[0].len, 'caractères', verif[0].len === 60 ? '✅' : '❌');
        console.log('========================================\n');
        console.log('🎉 Connectez-vous sur auth.html avec ces identifiants !\n');

    } catch (e) {
        console.error('\n❌ ERREUR :', e.message);
        console.error(e);
    }

    process.exit();
})();