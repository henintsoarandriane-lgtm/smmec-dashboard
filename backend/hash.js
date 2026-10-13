const bcrypt = require('bcryptjs');
(async () => {
    console.log('admin123  →', await bcrypt.hash('admin123', 10));
    console.log('member123 →', await bcrypt.hash('member123', 10));
})();