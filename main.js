// Configuration
const ADMIN_PASSWORD = "Ryosuke#001";
const WHATSAPP_NUMBER = "50936535649";
const INSTAGRAM_USERNAME = "claney_ht";

// Analytics
let analytics = {
    totalVisitors: 0,
    pageViews: 0,
    whatsappClicks: 0,
    instagramClicks: 0,
    visitDates: []
};

// Charger au démarrage
document.addEventListener('DOMContentLoaded', function() {
    loadAnalytics();
    trackVisit();
    initChat();
});

// Analytics
function loadAnalytics() {
    const saved = localStorage.getItem('claney_analytics');
    if (saved) {
        analytics = JSON.parse(saved);
    }
}

function saveAnalytics() {
    localStorage.setItem('claney_analytics', JSON.stringify(analytics));
}

function trackVisit() {
    analytics.totalVisitors++;
    analytics.pageViews++;
    analytics.visitDates.push(new Date().toISOString());
    saveAnalytics();
}

// Redirections
function redirectToWhatsApp() {
    analytics.whatsappClicks++;
    analytics.pageViews++;
    saveAnalytics();
    
    const message = "Bonjour Claney ! Je viens de voir ton portfolio et je souhaite discuter d'un projet.";
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function redirectToInstagram() {
    analytics.instagramClicks++;
    analytics.pageViews++;
    saveAnalytics();
    window.open(`https://instagram.com/${INSTAGRAM_USERNAME}`, '_blank');
}

function openEmail() {
    window.open('mailto:claneyht@gmail.com?subject=Demande%20de%20contact&body=Bonjour%20Claney,', '_blank');
}

// Chat
let chatOpen = false;

function initChat() {
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function toggleChat() {
    chatOpen = !chatOpen;
    document.querySelector('.chat-widget').classList.toggle('open', chatOpen);
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Ajouter message utilisateur
    addMessage(message, 'user');
    input.value = '';
    
    // Réponse automatique
    setTimeout(() => {
        let response = "Merci pour votre message ! Pour une réponse personnalisée, contactez-moi directement sur WhatsApp. Je réponds rapidement ! 📱";
        
        if (message.toLowerCase().includes('prix') || message.includes('tarif')) {
            response = "Mes tarifs débutent à 500€ pour un site web. Discutons de votre projet sur WhatsApp pour un devis précis !";
        } else if (message.includes('bonjour') || message.includes('salut')) {
            response = "Bonjour ! 👋 Ravie de vous rencontrer. Comment puis-je vous aider aujourd'hui ?";
        }
        
        addMessage(response, 'bot');
    }, 1000);
}

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Admin
function openAdminModal() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

function loginToAdmin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        alert('Accès admin réussi ! Dashboard en développement.');
        closeModal('adminLoginModal');
    } else {
        alert('Mot de passe incorrect !');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Fermer modals en cliquant dehors
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
