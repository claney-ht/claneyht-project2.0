// =============================================
// CONFIGURATION
// =============================================
const ADMIN_PASSWORD = "Ryosuke#001";
const WHATSAPP_NUMBER = "50936535649";
const INSTAGRAM_USERNAME = "claney_ht";
const EMAIL = "claneyht@gmail.com";

// =============================================
// ÉTAT GLOBAL
// =============================================
let analytics = {
    totalVisitors: 0,
    pageViews: 0,
    whatsappClicks: 0,
    instagramClicks: 0,
    contactFormSubmissions: 0,
    chatMessages: 0,
    bookings: 0,
    visitDates: [],
    dailyStats: {},
    referralSources: {}
};

let chatOpen = false;
let currentSection = 'accueil';

// =============================================
// INITIALISATION
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Site Claney HT initialisé');
    
    // Charger les données
    loadAnalytics();
    trackVisit();
    
    // Initialiser les composants
    initAnimations();
    initNavigation();
    initChat();
    initContactForm();
    initSkillBars();
    initScrollEffects();
    
    // Démarrer AOS
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });
});

// =============================================
// ANALYTICS & TRACKING
// =============================================
function loadAnalytics() {
    const saved = localStorage.getItem('claney_analytics');
    if (saved) {
        analytics = {...analytics, ...JSON.parse(saved)};
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
        const domain = new URL(referrer).hostname;
        analytics.referralSources[domain] = (analytics.referralSources[domain] || 0) + 1;
    }
    
    if (!analytics.dailyStats[today]) {
        analytics.dailyStats[today] = { 
            visits: 0, 
            clicks: { whatsapp: 0, instagram: 0 },
            forms: 0,
            chats: 0
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
        } else if (action === 'contactFormSubmissions') {
            analytics.dailyStats[today].forms += value;
        } else if (action === 'chatMessages') {
            analytics.dailyStats[today].chats += value;
        }
    }
    
    saveAnalytics();
    updateStatsDisplay();
}

// =============================================
// REDIRECTIONS & CONTACT
// =============================================
function redirectToWhatsApp() {
    trackAction('whatsappClicks');
    
    const message = `Bonjour Claney ! 👋 

Je viens de voir ton portfolio et je souhaite discuter d'un projet digital.

Pouvons-nous en parler ?`;
    
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function redirectToInstagram() {
    trackAction('instagramClicks');
    window.open(`https://instagram.com/${INSTAGRAM_USERNAME}`, '_blank');
}

function openEmail() {
    const subject = "Demande de contact - Portfolio Claney HT";
    const body = "Bonjour Claney,\n\nJe suis intéressé(e) par vos services et souhaiterais discuter d'un projet.\n\nCordialement,";
    window.open(`mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}

// =============================================
// CHAT EN DIRECT
// =============================================
function initChat() {
    const chatWidget = document.querySelector('.chat-widget');
    const chatInput = document.getElementById('chatInput');
    
    // Ouvrir/fermer le chat
    window.toggleChat = function() {
        chatOpen = !chatOpen;
        chatWidget.classList.toggle('open', chatOpen);
        
        if (chatOpen) {
            chatInput.focus();
            addBotMessage("Comment puis-je vous aider aujourd'hui ? 😊");
        }
    };
    
    // Envoyer un message
    window.sendMessage = function() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Message utilisateur
        addUserMessage(message);
        chatInput.value = '';
        
        // Réponse automatique après délai
        setTimeout(() => {
            handleChatResponse(message);
        }, 1000 + Math.random() * 2000);
    };
    
    // Entrée pour envoyer
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function addUserMessage(message) {
    trackAction('chatMessages');
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addBotMessage(message) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleChatResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    let response = "";
    
    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
        response = "Bonjour ! Ravie de vous rencontrer. Comment puis-je vous aider aujourd'hui ?";
    } else if (lowerMessage.includes('prix') || lowerMessage.includes('tarif') || lowerMessage.includes('combien')) {
        response = "Mes tarifs commencent à 500€ pour un site web basique, jusqu'à 1500€+ pour un écosystème digital complet. Souhaitez-vous discuter de votre projet spécifique ?";
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('téléphone') || lowerMessage.includes('appeler')) {
        response = "Vous pouvez me contacter par WhatsApp au +509 36 53 56 49 ou par Instagram @claney_ht. Je réponds rapidement !";
    } else if (lowerMessage.includes('portfolio') || lowerMessage.includes('projet') || lowerMessage.includes('réalisation')) {
        response = "J'ai travaillé sur divers projets : sites e-commerce, applications web, stratégies de trading. Voulez-vous voir des exemples spécifiques ?";
    } else if (lowerMessage.includes('délai') || lowerMessage.includes('temps') || lowerMessage.includes('livraison')) {
        response = "Les délais varient : 2-3 semaines pour un site simple, 6-8 semaines pour un projet complet. Cela dépend de la complexité de votre projet.";
    } else {
        response = "Je comprends votre demande ! Pour une réponse précise, contactez-moi directement sur WhatsApp. Je serai ravi de discuter de votre projet en détail. 📱";
    }
    
    addBotMessage(response);
}

// =============================================
// FORMULAIRES
// =============================================
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(this);
        });
    }
}

function handleFormSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Simulation d'envoi
    showNotification('Message envoyé avec succès ! Je vous réponds dans les 24h.', 'success');
    trackAction('contactFormSubmissions');
    
    // Redirection WhatsApp optionnelle
    setTimeout(() => {
        if (confirm('Souhaitez-vous continuer la discussion sur WhatsApp ?')) {
            redirectToWhatsApp();
        }
    }, 2000);
    
    form.reset();
}

// =============================================
// SYSTÈME DE RÉSERVATION
// =============================================
function openBookingModal() {
    document.getElementById('bookingModal').style.display = 'block';
}

function bookCall(type) {
    let message = "";
    let duration = "";
    
    switch(type) {
        case '15min':
            message = "Je souhaite réserver un call découverte de 15 minutes (gratuit) pour discuter de mon projet.";
            duration = "15 minutes";
            break;
        case '30min':
            message = "Je souhaite réserver une consultation de 30 minutes (50€) pour une analyse détaillée de mon projet.";
            duration = "30 minutes";
            break;
        case '60min':
            message = "Je souhaite réserver une session stratégique de 60 minutes (100€) pour établir un plan d'action complet.";
            duration = "60 minutes";
            break;
    }
    
    trackAction('bookings');
    
    const finalMessage = `${message}

Projet : [À préciser]
Disponibilités : [Vos crédisponibles]

Merci !`;
    
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
    window.open(url, '_blank');
    
    closeModal('bookingModal');
    showNotification(`Réservation ${duration} envoyée ! Je vous contacte pour confirmer.`, 'success');
}

// =============================================
// ADMIN DASHBOARD
// =============================================
function openAdminModal() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

function loginToAdmin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        closeModal('adminLoginModal');
        openAdminDashboard();
        showNotification('Connexion admin réussie !', 'success');
    } else {
        showNotification('Mot de passe incorrect !', 'error');
        document.getElementById('adminPassword').value = '';
    }
}

function openAdminDashboard() {
    updateStatsDisplay();
    renderCharts();
    document.getElementById('adminDashboard').style.display = 'block';
}

function updateStatsDisplay() {
    document.getElementById('totalVisitors').textContent = analytics.totalVisitors.toLocaleString();
    document.getElementById('pageViews').textContent = analytics.pageViews.toLocaleString();
    document.getElementById('whatsappClicks').textContent = analytics.whatsappClicks.toLocaleString();
    document.getElementById('instagramClicks').textContent = analytics.instagramClicks.toLocaleString();
}

function renderCharts() {
    // Données pour les 7 derniers jours
    const last7Days = getLast7Days();
    const visitData = last7Days.map(day => analytics.dailyStats[day]?.visits || 0);
    const whatsappData = last7Days.map(day => analytics.dailyStats[day]?.clicks.whatsapp || 0);
    const instagramData = last7Days.map(day => analytics.dailyStats[day]?.clicks.instagram || 0);
    
    // Chart des visiteurs
    const visitorsCtx = document.getElementById('visitorsChart');
    if (visitorsCtx) {
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
                    fill: true,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff', font: { size: 12 } }
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
    
    // Chart des clicks
    const clicksCtx = document.getElementById('clicksChart');
    if (clicksCtx) {
        new Chart(clicksCtx, {
            type: 'bar',
            data: {
                labels: last7Days.map(day => formatDate(day)),
                datasets: [
                    {
                        label: 'WhatsApp',
                        data: whatsappData,
                        backgroundColor: '#25D366',
                        borderColor: '#25D366',
                        borderWidth: 1
                    },
                    {
                        label: 'Instagram',
                        data: instagramData,
                        backgroundColor: '#E1306C',
                        borderColor: '#E1306C',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff', font: { size: 12 } }
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
    showNotification('Données exportées avec succès !', 'success');
}

function resetStats() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser TOUTES les statistiques ? Cette action est irréversible.')) {
        analytics = {
            totalVisitors: 0,
            pageViews: 0,
            whatsappClicks: 0,
            instagramClicks: 0,
            contactFormSubmissions: 0,
            chatMessages: 0,
            bookings: 0,
            visitDates: [],
            dailyStats: {},
            referralSources: {}
        };
        saveAnalytics();
        updateStatsDisplay();
        if (document.getElementById('adminDashboard').style.display === 'block') {
            renderCharts();
        }
        showNotification('Statistiques réinitialisées !', 'success');
    }
}

// =============================================
// ANIMATIONS & EFFETS
// =============================================
function initAnimations() {
    // Animation des cartes au scroll
    const cards = document.querySelectorAll('.project-card, .service-card, .blog-card, .testimonial-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Animation du hero
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(-30px)';
        
        setTimeout(() => {
            hero.style.transition = 'opacity 1s ease, transform 1s ease';
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 300);
    }
}

function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    skillBars.forEach(bar => {
        const width = bar.getAttribute('data-width');
        setTimeout(() => {
            bar.style.width = width + '%';
        }, 500);
    });
}

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
            }
        });
    });

    // Mise à jour navigation active
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

function initScrollEffects() {
    // Effet parallaxe léger
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.hero-background');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

// =============================================
// MODALS & NOTIFICATIONS
// =============================================
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
        if (chatOpen) {
            toggleChat();
        }
    }
});

function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Styles de notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: #000;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-weight: bold;
    `;
    
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

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
        warning: 'exclamation-triangle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(45deg, #00ff88, #00ccff)',
        error: 'linear-gradient(45deg, #ff6b6b, #ff8e8e)',
        info: 'linear-gradient(45deg, #00ffff, #0080ff)',
        warning: 'linear-gradient(45deg, #ffd93d, #ff6b6b)'
    };
    return colors[type] || '#00ffff';
}

// =============================================
// UTILITAIRES
// =============================================
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

function formatNumber(num) {
    return num.toLocaleString('fr-FR');
}

// =============================================
// FONCTIONS GLOBALES
// =============================================
// Rendre les fonctions accessibles globalement
window.redirectToWhatsApp = redirectToWhatsApp;
window.redirectToInstagram = redirectToInstagram;
window.openEmail = openEmail;
window.openContactModal = openContactModal;
window.openBookingModal = openBookingModal;
window.bookCall = bookCall;
window.openAdminModal = openAdminModal;
window.loginToAdmin = loginToAdmin;
window.exportData = exportData;
window.resetStats = resetStats;
window.closeModal = closeModal;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;

console.log('✅ Toutes les fonctionnalités sont chargées !');
