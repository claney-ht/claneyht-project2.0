// =============================================
// CONFIGURATION GLOBALE
// =============================================
const CONFIG = {
    ADMIN_PASSWORD: "Ryosuke#001",
    WHATSAPP_NUMBER: "50936535649",
    INSTAGRAM_USERNAME: "claney_ht",
    EMAIL: "claneyht@gmail.com"
};

// =============================================
// ÉTAT GLOBAL ET ANALYTICS
// =============================================
let analytics = {
    totalVisitors: 0,
    pageViews: 0,
    whatsappClicks: 0,
    instagramClicks: 0,
    contactFormSubmissions: 0,
    modalViews: 0,
    visitDates: [],
    dailyStats: {},
    referralSources: {}
};

let currentSection = 'accueil';

// =============================================
// INITIALISATION
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Site Claney HT initialisé - 2025');
    
    // Charger les analytics
    loadAnalytics();
    trackVisit();
    
    // Initialiser les fonctionnalités
    initNavigation();
    initScrollEffects();
    initModals();
    
    // Mettre à jour l'affichage
    updateActiveNav();
});

// =============================================
// SYSTÈME D'ANALYTICS
// =============================================
function loadAnalytics() {
    const saved = localStorage.getItem('claney_analytics');
    if (saved) {
        const parsed = JSON.parse(saved);
        analytics = { ...analytics, ...parsed };
        updateStatsDisplay();
    }
}

function saveAnalytics() {
    localStorage.setItem('claney_analytics', JSON.stringify(analytics));
}

function trackVisit() {
    analytics.totalVisitors++;
    analytics.pageViews++;
    
    const today = new Date().toDateString();
    analytics.visitDates.push(new Date().toISOString());
    
    // Source de référence
    const referrer = document.referrer;
    if (referrer) {
        try {
            const domain = new URL(referrer).hostname;
            analytics.referralSources[domain] = (analytics.referralSources[domain] || 0) + 1;
        } catch (e) {
            console.log('Source de référence non valide');
        }
    }
    
    if (!analytics.dailyStats[today]) {
        analytics.dailyStats[today] = { 
            visits: 0, 
            clicks: { whatsapp: 0, instagram: 0 },
            modals: 0
        };
    }
    analytics.dailyStats[today].visits++;
    
    saveAnalytics();
}

function trackAction(action, value = 1) {
    analytics[action] += value;
    analytics.pageViews++;
    
    const today = new Date().toDateString();
    if (analytics.dailyStats[today]) {
        if (action === 'whatsappClicks') {
            analytics.dailyStats[today].clicks.whatsapp += value;
        } else if (action === 'instagramClicks') {
            analytics.dailyStats[today].clicks.instagram += value;
        } else if (action === 'modalViews') {
            analytics.dailyStats[today].modals += value;
        }
    }
    
    saveAnalytics();
    updateStatsDisplay();
}

// =============================================
// NAVIGATION ET SCROLL
// =============================================
function initNavigation() {
    // Navigation smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Mettre à jour la navigation active
                const sectionId = this.getAttribute('href').substring(1);
                currentSection = sectionId;
                updateActiveNav();
            }
        });
    });

    // Mise à jour navigation au scroll
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                currentSection = sectionId;
                updateActiveNav();
            }
        });
    });
}

function updateActiveNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        currentSection = sectionId;
        updateActiveNav();
    }
}

function initScrollEffects() {
    // Animation au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observer les éléments à animer
    const animatedElements = document.querySelectorAll(
        '.solution-card, .algo-card, .trading-card, .result-card, .case-study'
    );

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// =============================================
// SYSTÈME DE MODALS
// =============================================
function initModals() {
    // Fermer les modals en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // Fermer avec la touche Échap
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="display: block"]');
            openModals.forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

function openSolutionModal(type) {
    trackAction('modalViews');
    
    let modalId = '';
    switch(type) {
        case 'architecture':
            modalId = 'architectureModal';
            break;
        case 'formation':
            modalId = 'formationModal';
            break;
        case 'trading':
            modalId = 'tradingModal';
            break;
    }
    
    if (modalId) {
        document.getElementById(modalId).style.display = 'block';
    }
}

function openContactModal(context) {
    const message = getPredefinedMessage(context);
    openWhatsApp(message);
}

function getPredefinedMessage(context) {
    const messages = {
        'formation_tiktok': `Bonjour Claney ! 👋 

Je suis intéressé(e) par votre formation TikTok Expert 2025. 
Pouvons-nous discuter du programme et des modalités ?

💡 Mon objectif : [Votre objectif]`,
        
        'formation_instagram': `Bonjour Claney ! 📸

Je souhaite maîtriser l'algorithme Instagram 2025.
Pouvons-nous discuter de votre formation ?

🎯 Mon besoin : [Décrivez votre besoin]`,
        
        'formation_youtube': `Bonjour Claney ! 🎥

Je veux optimiser ma chaîne YouTube avec vos stratégies 2025.
Pouvons-nous échanger sur la formation ?

📊 Mon contexte : [Votre situation]`
    };
    
    return messages[context] || `Bonjour Claney ! 

Je suis intéressé(e) par vos services et souhaiterais discuter d'un projet.

📋 Mon projet : [Décrivez brièvement]`;
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// =============================================
// SYSTÈME DE CONTACT
// =============================================
function openWhatsApp(customMessage = null) {
    trackAction('whatsappClicks');
    
    const defaultMessage = `Bonjour Claney ! 👋

Je viens de voir votre portfolio et je souhaite discuter d'un projet digital.

🚀 Mon projet : [Décrivez votre projet]
🎯 Mon objectif : [Votre objectif principal]
💼 Budget : [Si vous avez une idée]`;
    
    const message = customMessage || defaultMessage;
    const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function openEmail() {
    const subject = "Demande de contact - Portfolio Claney HT";
    const body = `Bonjour Claney,

Je suis intéressé(e) par vos services et souhaiterais discuter d'un projet digital.

🔍 Mon projet :
[Description détaillée de votre projet]

🎯 Mes objectifs :
[Vos objectifs principaux]

📅 Timeline souhaitée :
[Votre calendrier]

💰 Budget :
[Si applicable]

Cordialement,
[Votre nom]`;
    
    window.open(`mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}

function openCalendly() {
    // Simuler l'ouverture de Calendly
    alert('🎯 Fonctionnalité Calendly à intégrer\n\nPour le moment, contactez-moi directement sur WhatsApp pour planifier un appel.');
    openWhatsApp('Bonjour Claney ! Je souhaite planifier un appel découverte de 30 minutes.');
}

// =============================================
// SYSTÈME ADMIN
// =============================================
function openAdminModal() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

function loginToAdmin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        closeModal('adminLoginModal');
        openAdminDashboard();
        showNotification('🔐 Connexion admin réussie !', 'success');
    } else {
        showNotification('❌ Mot de passe incorrect !', 'error');
        document.getElementById('adminPassword').value = '';
    }
}

function openAdminDashboard() {
    updateStatsDisplay();
    document.getElementById('adminDashboard').style.display = 'block';
}

function updateStatsDisplay() {
    document.getElementById('totalVisitors').textContent = analytics.totalVisitors.toLocaleString();
    document.getElementById('pageViews').textContent = analytics.pageViews.toLocaleString();
    document.getElementById('whatsappClicks').textContent = analytics.whatsappClicks.toLocaleString();
    document.getElementById('instagramClicks').textContent = analytics.instagramClicks.toLocaleString();
}

function exportData() {
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `claney-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('📊 Données exportées avec succès !', 'success');
}

function resetStats() {
    if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser TOUTES les statistiques ?\n\nCette action est irréversible.')) {
        analytics = {
            totalVisitors: 0,
            pageViews: 0,
            whatsappClicks: 0,
            instagramClicks: 0,
            contactFormSubmissions: 0,
            modalViews: 0,
            visitDates: [],
            dailyStats: {},
            referralSources: {}
        };
        saveAnalytics();
        updateStatsDisplay();
        showNotification('🔄 Statistiques réinitialisées !', 'success');
    }
}

// =============================================
// NOTIFICATIONS
// =============================================
function showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Styles de notification
    const colors = {
        success: 'linear-gradient(45deg, #00ff88, #00ccff)',
        error: 'linear-gradient(45deg, #ff6b6b, #ff8e8e)',
        info: 'linear-gradient(45deg, #00ffff, #0080ff)',
        warning: 'linear-gradient(45deg, #ffd93d, #ff6b6b)'
    };
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: colors[type] || colors.info,
        color: '#000',
        padding: '1rem 1.5rem',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        zIndex: '3000',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        fontWeight: 'bold',
        fontSize: '14px'
    });
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// =============================================
// FONCTIONS GLOBALES
// =============================================
// Rendre les fonctions accessibles globalement
window.openAdminModal = openAdminModal;
window.loginToAdmin = loginToAdmin;
window.exportData = exportData;
window.resetStats = resetStats;
window.closeModal = closeModal;
window.openSolutionModal = openSolutionModal;
window.openContactModal = openContactModal;
window.openWhatsApp = openWhatsApp;
window.openEmail = openEmail;
window.openCalendly = openCalendly;
window.scrollToSection = scrollToSection;

// Fonctions pour les modals trading
window.openTradingModal = function(type) {
    trackAction('modalViews');
    document.getElementById('tradingModal').style.display = 'block';
};

// Fonctions pour les modals légaux
window.openLegalModal = function(type) {
    const messages = {
        'mentions': '📄 Mentions légales en cours de rédaction...',
        'confidentialite': '🔐 Politique de confidentialité en cours de rédaction...',
        'cookies': '🍪 Gestion des cookies en cours de configuration...'
    };
    alert(messages[type] || 'Document en cours de préparation.');
};

console.log('✅ Toutes les fonctionnalités JavaScript sont chargées !');

// =============================================
// UTILITAIRES
// =============================================
function formatNumber(num) {
    return num.toLocaleString('fr-FR');
}

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
