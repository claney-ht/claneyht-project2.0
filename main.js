// Configuration
const ADMIN_PASSWORD = "Ryosuke#001"; // Change ce mot de passe
const WHATSAPP_NUMBER = "50936535649";
const INSTAGRAM_USERNAME = "claney_ht";

// Statistiques
let analytics = {
    totalVisitors: 0,
    pageViews: 0,
    whatsappClicks: 0,
    instagramClicks: 0,
    visitDates: [],
    dailyStats: {}
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadAnalytics();
    trackVisit();
    initAnimations();
});

// Charger les analytics depuis le localStorage
function loadAnalytics() {
    const saved = localStorage.getItem('claney_analytics');
    if (saved) {
        analytics = JSON.parse(saved);
        updateStatsDisplay();
    }
}

// Sauvegarder les analytics
function saveAnalytics() {
    localStorage.setItem('claney_analytics', JSON.stringify(analytics));
}

// Tracker une visite
function trackVisit() {
    analytics.totalVisitors++;
    analytics.pageViews++;
    
    const today = new Date().toDateString();
    analytics.visitDates.push(new Date().toISOString());
    
    if (!analytics.dailyStats[today]) {
        analytics.dailyStats[today] = { visits: 0, clicks: { whatsapp: 0, instagram: 0 } };
    }
    analytics.dailyStats[today].visits++;
    
    saveAnalytics();
    updateStatsDisplay();
}

// Redirections
function redirectToWhatsApp() {
    analytics.whatsappClicks++;
    analytics.pageViews++;
    
    const today = new Date().toDateString();
    if (analytics.dailyStats[today]) {
        analytics.dailyStats[today].clicks.whatsapp++;
    }
    
    saveAnalytics();
    
    const message = "Bonjour Claney ! Je viens de voir ton portfolio et je souhaite discuter d'un projet.";
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function redirectToInstagram() {
    analytics.instagramClicks++;
    analytics.pageViews++;
    
    const today = new Date().toDateString();
    if (analytics.dailyStats[today]) {
        analytics.dailyStats[today].clicks.instagram++;
    }
    
    saveAnalytics();
    window.open(`https://instagram.com/${INSTAGRAM_USERNAME}`, '_blank');
}

// Menu Admin
function openAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

function loginToAdmin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        closeModal('adminLoginModal');
        openAdminDashboard();
    } else {
        alert('Mot de passe incorrect !');
    }
}

function openAdminDashboard() {
    updateStatsDisplay();
    renderCharts();
    document.getElementById('adminDashboard').style.display = 'block';
}

function updateStatsDisplay() {
    document.getElementById('totalVisitors').textContent = analytics.totalVisitors;
    document.getElementById('pageViews').textContent = analytics.pageViews;
    document.getElementById('whatsappClicks').textContent = analytics.whatsappClicks;
    document.getElementById('instagramClicks').textContent = analytics.instagramClicks;
}

function renderCharts() {
    // Données pour les 7 derniers jours
    const last7Days = getLast7Days();
    const visitData = last7Days.map(day => analytics.dailyStats[day]?.visits || 0);
    const whatsappData = last7Days.map(day => analytics.dailyStats[day]?.clicks.whatsapp || 0);
    const instagramData = last7Days.map(day => analytics.dailyStats[day]?.clicks.instagram || 0);
    
    // Chart des visiteurs
    const visitorsCtx = document.getElementById('visitorsChart').getContext('2d');
    new Chart(visitorsCtx, {
        type: 'line',
        data: {
            labels: last7Days.map(day => formatDate(day)),
            datasets: [{
                label: 'Visites',
                data: visitData,
                borderColor: '#00ffff',
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#cccccc' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: '#cccccc' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
    
    // Chart des clicks
    const clicksCtx = document.getElementById('clicksChart').getContext('2d');
    new Chart(clicksCtx, {
        type: 'bar',
        data: {
            labels: last7Days.map(day => formatDate(day)),
            datasets: [
                {
                    label: 'WhatsApp',
                    data: whatsappData,
                    backgroundColor: '#25D366'
                },
                {
                    label: 'Instagram',
                    data: instagramData,
                    backgroundColor: '#E1306C'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#cccccc' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: '#cccccc' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}

// Utilitaires
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toDateString());
    }
    return days;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function exportData() {
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `claney-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function resetStats() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les statistiques ?')) {
        analytics = {
            totalVisitors: 0,
            pageViews: 0,
            whatsappClicks: 0,
            instagramClicks: 0,
            visitDates: [],
            dailyStats: {}
        };
        saveAnalytics();
        updateStatsDisplay();
        renderCharts();
    }
}

// Fonctions modals existantes
function openContactModal() {
    document.getElementById('contactModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Fermer les modals en cliquant à l'extérieur
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Fermer avec Échap
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.getElementsByClassName('modal');
        for (let modal of modals) {
            modal.style.display = 'none';
        }
    }
});

// Animations
function initAnimations() {
    const cards = document.querySelectorAll('.project-card, .contact-option');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}
