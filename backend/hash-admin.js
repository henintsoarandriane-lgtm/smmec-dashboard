const bcrypt = require('bcryptjs');
(async () => {
    const hash = await bcrypt.hash('Admin2026!', 10);
    console.log('\n🔑 Hash pour admin :\n');
    console.log(hash);
    console.log('\n📋 Copiez ce hash dans phpMyAdmin\n');
})();