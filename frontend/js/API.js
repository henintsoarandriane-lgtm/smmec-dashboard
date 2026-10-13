// ==========================================
// smmec-frontend/js/api.js
// ==========================================

const API_URL = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('token'); }

function getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
}

function requireAuth(requiredRole = null) {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
        alert('⛔ Vous devez être connecté.');
        window.location.href = '../auth.html';
        return false;
    }
    if (requiredRole && user.role !== requiredRole) {
        alert('⛔ Accès non autorisé.');
        window.location.href = '../auth.html';
        return false;
    }
    return true;
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Erreur API');
    return data;
}

function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('smmec_position');
        window.location.href = '../auth.html';
    }
}

function formatAr(montant) {
    if (!montant) return '0 Ar';
    return parseInt(montant).toLocaleString('fr-FR') + ' Ar';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function getStatutLabel(statut) {
    const labels = {
        'en_attente': '⏳ En attente',
        'en_cours': '🔄 En cours',
        'approuve': '✅ Approuvé',
        'refuse': '❌ Refusé',
        'ouverte': '✅ Ouverte',
        'cloturee': '🔒 Clôturée'
    };
    return labels[statut] || statut;
}