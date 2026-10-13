const bcrypt = require('bcryptjs');

async function main() {
    // ⚠️ MODIFIEZ CES MOTS DE PASSE
    const adminPass = 'smmecadmin123';
    const membrePass = 'smmecmembre123';

    const hash1 = await bcrypt.hash(adminPass, 10);
    const hash2 = await bcrypt.hash(membrePass, 10);

    console.log('\n========================================');
    console.log('HASH POUR ADMIN :', adminPass);
    console.log('========================================');
    console.log(hash1);
    console.log('\n========================================');
    console.log('HASH POUR MEMBRE :', membrePass);
    console.log('========================================');
    console.log(hash2);
    console.log('\n📋 COPIEZ CES HASHs pour phpMyAdmin\n');
}

main();