// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { connectDB } = require('./config/database');

dotenv.config();
const app = express();
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
app.set('io', io);

io.on('connection', (socket) => {
    console.log('🔌 Socket connecté :', socket.id);

    socket.on('join-user', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`👤 Utilisateur ${userId} → room user-${userId}`);
    });

    socket.on('join-admin', () => {
        socket.join('admins');
        console.log('👑 Admin rejoint la room admins');
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket déconnecté :', socket.id);
    });
});

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

// ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/credit', require('./routes/creditRoutes'));
app.use('/api/epargne', require('./routes/epargneRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/hierarchy', require('./routes/hierarchyRoutes'));
app.use('/api/taux', require('./routes/tauxRoutes'));

app.get('/', (req, res) => res.json({
    message: '🚀 API SMMEC en ligne !',
    sockets: 'Socket.IO actif'
}));

app.use((req, res) => res.status(404).json({ message: 'Route non trouvée' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur SMMEC démarré sur le port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO actif`);
});