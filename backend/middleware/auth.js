const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant.' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Token invalide.' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Admin requis.' });
    next();
};

module.exports = { authMiddleware, adminMiddleware };