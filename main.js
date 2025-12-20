// ============================================
// PAYFUSION - MAIN JAVASCRIPT FILE
// Script global pour toutes les pages
// ============================================

// ===== CONFIGURATION GLOBALE =====
const APP_CONFIG = {
    APP_NAME: 'PayFusion',
    VERSION: '1.0.0',
    CURRENCY: 'HTG',
    EXCHANGE_RATE: 150, // 1 USD = 150 HTG
    CONTACT_WHATSAPP: '+50939442808',
    CONTACT_EMAIL: 'support.payfusion@gmail.com',
    ADMIN_EMAIL: 'payfusion@admin.com',
    USDT_ADDRESS: 'TJHVCbXMBQdtzurHngB1aXSFkR9TWYvZ94',
    MONCASH_NUMBER: '+50939442808',
    NATCASH_NUMBER: '+50935741778'
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si Firebase est chargé
    if (typeof firebase !== 'undefined') {
        initFirebase();
    }
    
    // Initialiser les composants communs
    initCommonComponents();
    
    // Vérifier l'état de connexion
    checkAuthState();
    
    // Initialiser les écouteurs d'événements globaux
    initGlobalEventListeners();
    
    console.log('PayFusion initialisé - Version', APP_CONFIG.VERSION);
});

// ===== FONCTIONS D'AUTHENTIFICATION =====
function checkAuthState() {
    // Vérifier si l'utilisateur est connecté
    const protectedPages = ['home.html', 'wallet.html', 'services.html', 'freefire.html', 'netflix.html', 'payment.html', 'account.html', 'settings.html', 'notifications.html', 'community.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        // Vérifier le token d'authentification dans localStorage
        const authToken = localStorage.getItem('payfusion_auth_token');
        const userData = localStorage.getItem('payfusion_user_data');
        
        if (!authToken || !userData) {
            // Rediriger vers la page de connexion
            window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
        } else {
            // Mettre à jour l'interface avec les données utilisateur
            updateUserInterface(JSON.parse(userData));
        }
    }
    
    // Vérifier si l'utilisateur essaie d'accéder aux pages d'auth alors qu'il est déjà connecté
    const authPages = ['login.html', 'register.html'];
    if (authPages.includes(currentPage)) {
        const authToken = localStorage.getItem('payfusion_auth_token');
        if (authToken) {
            window.location.href = 'home.html';
        }
    }
}

function updateUserInterface(userData) {
    // Mettre à jour le nom d'utilisateur dans le header
    const userNameElements = document.querySelectorAll('.pf-user-name');
    const userEmailElements = document.querySelectorAll('.pf-user-email');
    const userAvatarElements = document.querySelectorAll('.pf-user-avatar');
    
    if (userNameElements.length > 0 && userData.firstName) {
        userNameElements.forEach(el => {
            el.textContent = `${userData.firstName} ${userData.lastName}`;
        });
    }
    
    if (userEmailElements.length > 0 && userData.email) {
        userEmailElements.forEach(el => {
            el.textContent = userData.email;
        });
    }
    
    if (userAvatarElements.length > 0) {
        userAvatarElements.forEach(el => {
            const initials = userData.firstName ? 
                (userData.firstName.charAt(0) + (userData.lastName ? userData.lastName.charAt(0) : '')) : 
                'U';
            el.textContent = initials.toUpperCase();
        });
    }
}

// ===== FONCTIONS UTILITAIRES =====
function formatCurrency(amount, currency = APP_CONFIG.CURRENCY) {
    const formatter = new Intl.NumberFormat('fr-HT', {
        style: 'currency',
        currency: currency === 'USD' ? 'USD' : 'HTG',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
}

function formatDate(date, includeTime = true) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...(includeTime && {
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    return new Intl.DateTimeFormat('fr-FR', options).format(new Date(date));
}

function calculateHTG(usdAmount) {
    return usdAmount * APP_CONFIG.EXCHANGE_RATE;
}

function calculateUSD(htgAmount) {
    return htgAmount / APP_CONFIG.EXCHANGE_RATE;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^\+?[0-9]{10,15}$/;
    return re.test(phone.replace(/\s/g, ''));
}

function isValidWhatsApp(whatsapp) {
    const re = /^\+509[0-9]{8}$/;
    return re.test(whatsapp.replace(/\s/g, ''));
}

function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CMD-${timestamp.slice(-6)}${random}`;
}

function generateTransactionId() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TRX-${timestamp.slice(-8)}${random}`;
}

// ===== GESTION DES MESSAGES =====
function showSuccess(message, duration = 3000) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'pf-message pf-message-success';
    messageDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button class="pf-message-close">&times;</button>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Animation d'entrée
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 10);
    
    // Fermeture automatique
    setTimeout(() => {
        closeMessage(messageDiv);
    }, duration);
    
    // Fermeture manuelle
    messageDiv.querySelector('.pf-message-close').addEventListener('click', () => {
        closeMessage(messageDiv);
    });
}

function showError(message, duration = 5000) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'pf-message pf-message-error';
    messageDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="pf-message-close">&times;</button>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        closeMessage(messageDiv);
    }, duration);
    
    messageDiv.querySelector('.pf-message-close').addEventListener('click', () => {
        closeMessage(messageDiv);
    });
}

function showLoading(button, text = 'Chargement...') {
    if (!button) return null;
    
    const originalHTML = button.innerHTML;
    button.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        ${text}
    `;
    button.disabled = true;
    
    return originalHTML;
}

function hideLoading(button, originalHTML) {
    if (!button || !originalHTML) return;
    
    button.innerHTML = originalHTML;
    button.disabled = false;
}

function closeMessage(messageDiv) {
    messageDiv.classList.remove('show');
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 300);
}

// ===== GESTION DES FORMULAIRES =====
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        const errorDiv = input.parentElement.querySelector('.pf-error-message');
        
        if (!input.value.trim()) {
            if (errorDiv) {
                errorDiv.textContent = 'Ce champ est requis';
                errorDiv.classList.add('show');
            }
            isValid = false;
            input.classList.add('error');
        } else {
            if (errorDiv) {
                errorDiv.classList.remove('show');
            }
            input.classList.remove('error');
            
            // Validation spécifique
            if (input.type === 'email' && !isValidEmail(input.value)) {
                if (errorDiv) {
                    errorDiv.textContent = 'Email invalide';
                    errorDiv.classList.add('show');
                }
                isValid = false;
                input.classList.add('error');
            }
            
            if (input.type === 'tel' && input.id.includes('whatsapp') && !isValidWhatsApp(input.value)) {
                if (errorDiv) {
                    errorDiv.textContent = 'Format WhatsApp: +509XXXXXXXX';
                    errorDiv.classList.add('show');
                }
                isValid = false;
                input.classList.add('error');
            }
        }
    });
    
    return isValid;
}

function resetForm(form) {
    form.reset();
    const errors = form.querySelectorAll('.pf-error-message');
    errors.forEach(error => error.classList.remove('show'));
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => input.classList.remove('error'));
}

// ===== GESTION DES FICHIERS =====
function validateFile(file, options = {}) {
    const defaults = {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf']
    };
    
    const config = { ...defaults, ...options };
    
    if (file.size > config.maxSize) {
        return { valid: false, error: `Fichier trop volumineux. Maximum: ${config.maxSize / 1024 / 1024}MB` };
    }
    
    if (!config.allowedTypes.includes(file.type)) {
        return { valid: false, error: `Format non supporté. Utilisez: ${config.allowedExtensions.join(', ')}` };
    }
    
    return { valid: true };
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// ===== NAVIGATION ET UI =====
function initCommonComponents() {
    // Initialiser les tooltips
    initTooltips();
    
    // Initialiser les dropdowns
    initDropdowns();
    
    // Initialiser les modals
    initModals();
    
    // Initialiser les onglets
    initTabs();
    
    // Initialiser les accordéons
    initAccordions();
}

function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltipText = this.getAttribute('data-tooltip');
            const tooltip = document.createElement('div');
            tooltip.className = 'pf-tooltip';
            tooltip.textContent = tooltipText;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
            tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip && this._tooltip.parentNode) {
                this._tooltip.parentNode.removeChild(this._tooltip);
                this._tooltip = null;
            }
        });
    });
}

function initDropdowns() {
    const dropdowns = document.querySelectorAll('.pf-dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.pf-dropdown-toggle');
        const menu = dropdown.querySelector('.pf-dropdown-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', function(e) {
                e.stopPropagation();
                menu.classList.toggle('show');
            });
        }
    });
    
    // Fermer les dropdowns en cliquant ailleurs
    document.addEventListener('click', function() {
        dropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.pf-dropdown-menu');
            if (menu) menu.classList.remove('show');
        });
    });
}

function initModals() {
    const modals = document.querySelectorAll('.pf-modal');
    
    modals.forEach(modal => {
        const openButtons = document.querySelectorAll(`[data-modal="${modal.id}"]`);
        const closeButton = modal.querySelector('.pf-modal-close');
        
        openButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            });
        });
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            });
        }
        
        // Fermer en cliquant en dehors
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    });
}

function initTabs() {
    const tabContainers = document.querySelectorAll('.pf-tabs-container');
    
    tabContainers.forEach(container => {
        const tabs = container.querySelectorAll('.pf-tab');
        const contents = container.querySelectorAll('.pf-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // Mettre à jour les onglets
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Mettre à jour le contenu
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}-tab` || content.getAttribute('data-tab') === tabId) {
                        content.classList.add('active');
                    }
                });
            });
        });
    });
}

function initAccordions() {
    const accordions = document.querySelectorAll('.pf-accordion');
    
    accordions.forEach(accordion => {
        const header = accordion.querySelector('.pf-accordion-header');
        const content = accordion.querySelector('.pf-accordion-content');
        
        if (header && content) {
            header.addEventListener('click', () => {
                const isOpen = content.classList.contains('show');
                
                // Fermer tous les autres accordéons si nécessaire
                if (accordion.classList.contains('pf-accordion-single')) {
                    accordions.forEach(acc => {
                        if (acc !== accordion) {
                            acc.querySelector('.pf-accordion-content').classList.remove('show');
                            acc.querySelector('.pf-accordion-icon').textContent = '+';
                        }
                    });
                }
                
                // Basculer l'accordéon actuel
                content.classList.toggle('show');
                const icon = header.querySelector('.pf-accordion-icon');
                if (icon) {
                    icon.textContent = content.classList.contains('show') ? '−' : '+';
                }
            });
        }
    });
}

// ===== GESTION DES ÉVÉNEMENTS GLOBAUX =====
function initGlobalEventListeners() {
    // Gérer les formulaires avec la classe pf-form
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.classList.contains('pf-form')) {
            e.preventDefault();
            
            if (validateForm(form)) {
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalHTML = showLoading(submitBtn);
                
                // Simuler l'envoi (à remplacer par l'appel API réel)
                setTimeout(() => {
                    hideLoading(submitBtn, originalHTML);
                    showSuccess('Formulaire soumis avec succès !');
                    resetForm(form);
                }, 1500);
            }
        }
    });
    
    // Gérer les clics sur les liens externes
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith('http') && !link.href.includes(window.location.hostname)) {
            e.preventDefault();
            const confirmed = confirm('Vous allez quitter PayFusion. Continuer ?');
            if (confirmed) {
                window.open(link.href, '_blank');
            }
        }
    });
    
    // Gérer les entrées dans les champs de montant
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('pf-amount-input')) {
            formatAmountInput(e.target);
        }
        
        if (e.target.classList.contains('pf-phone-input')) {
            formatPhoneInput(e.target);
        }
    });
    
    // Gérer la touche Escape pour fermer les modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.pf-modal.show');
            modals.forEach(modal => {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            });
        }
    });
}

function formatAmountInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value) {
        const numericValue = parseInt(value, 10);
        input.value = numericValue.toLocaleString('fr-HT');
    }
}

function formatPhoneInput(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('509')) {
        value = '+509' + value.slice(3);
    } else if (value.startsWith('0')) {
        value = '+509' + value.slice(1);
    } else if (value.length === 8) {
        value = '+509' + value;
    }
    
    input.value = value;
}

// ===== FIREBASE INITIALISATION =====
function initFirebase() {
    try {
        // Vérifier si Firebase est déjà initialisé
        if (!firebase.apps.length) {
            // Les configurations sont dans firebase-config.js
            console.log('Firebase initialisé depuis main.js');
        }
        
        // Écouter les changements d'état d'authentification
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // Utilisateur connecté
                localStorage.setItem('payfusion_auth_token', user.accessToken || 'simulated-token');
                
                // Récupérer les données utilisateur depuis Firestore
                firebase.firestore().collection('users').doc(user.uid).get()
                    .then(doc => {
                        if (doc.exists) {
                            const userData = doc.data();
                            localStorage.setItem('payfusion_user_data', JSON.stringify(userData));
                            updateUserInterface(userData);
                        }
                    })
                    .catch(error => {
                        console.error('Erreur récupération utilisateur:', error);
                    });
            } else {
                // Utilisateur déconnecté
                localStorage.removeItem('payfusion_auth_token');
                localStorage.removeItem('payfusion_user_data');
            }
        });
        
    } catch (error) {
        console.error('Erreur initialisation Firebase:', error);
    }
}

// ===== GESTION DES OFFLINE/ONLINE =====
function initOnlineStatus() {
    function updateOnlineStatus() {
        if (navigator.onLine) {
            showSuccess('Vous êtes de nouveau en ligne');
            document.documentElement.classList.remove('offline');
        } else {
            showError('Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.');
            document.documentElement.classList.add('offline');
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Vérifier l'état initial
}

// ===== PERFORMANCE ET ANALYTIQUES =====
function trackPageView() {
    // Envoyer les données d'analyse si disponible
    if (typeof gtag !== 'undefined') {
        gtag('config', 'G-XXXXXXXXXX', {
            page_path: window.location.pathname,
            page_title: document.title
        });
    }
    
    // Enregistrer dans les logs Firebase
    if (typeof firebase !== 'undefined') {
        const userId = localStorage.getItem('payfusion_user_id');
        if (userId) {
            firebase.firestore().collection('page_views').add({
                userId: userId,
                page: window.location.pathname,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent
            });
        }
    }
}

// ===== EXPORT DES FONCTIONS GLOBALES =====
// Rendre les fonctions disponibles globalement
window.PayFusion = {
    APP_CONFIG,
    formatCurrency,
    formatDate,
    calculateHTG,
    calculateUSD,
    isValidEmail,
    isValidPhone,
    isValidWhatsApp,
    showSuccess,
    showError,
    showLoading,
    hideLoading,
    validateForm,
    resetForm,
    generateOrderNumber,
    generateTransactionId,
    trackPageView
};

// ===== STYLES DYNAMIQUES POUR LES COMPOSANTS =====
function injectGlobalStyles() {
    const styles = `
        /* Messages */
        .pf-message {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 9999;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 400px;
        }
        
        .pf-message.show {
            transform: translateX(0);
        }
        
        .pf-message-success {
            background: #10b981;
            color: white;
            border-left: 4px solid #059669;
        }
        
        .pf-message-error {
            background: #ef4444;
            color: white;
            border-left: 4px solid #dc2626;
        }
        
        .pf-message-close {
            background: none;
            border: none;
            color: inherit;
            font-size: 1.5rem;
            cursor: pointer;
            margin-left: auto;
            padding: 0;
            line-height: 1;
        }
        
        /* Tooltips */
        .pf-tooltip {
            position: fixed;
            background: #1f2937;
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
        }
        
        /* États offline */
        .offline .pf-online-only {
            opacity: 0.5;
            pointer-events: none;
        }
        
        /* Validation */
        .pf-error-message {
            color: #ef4444;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: none;
        }
        
        .pf-error-message.show {
            display: block;
        }
        
        input.error,
        select.error,
        textarea.error {
            border-color: #ef4444 !important;
        }
        
        /* Dropdowns */
        .pf-dropdown-menu {
            display: none;
            position: absolute;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            min-width: 200px;
        }
        
        .pf-dropdown-menu.show {
            display: block;
        }
        
        /* Modals */
        .pf-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            align-items: center;
            justify-content: center;
        }
        
        .pf-modal.show {
            display: flex;
        }
        
        .pf-modal-content {
            background: white;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .pf-modal-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #64748b;
        }
        
        /* Tabs */
        .pf-tab-content {
            display: none;
        }
        
        .pf-tab-content.active {
            display: block;
        }
        
        /* Accordions */
        .pf-accordion-content {
            display: none;
        }
        
        .pf-accordion-content.show {
            display: block;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// Injecter les styles au chargement
injectGlobalStyles();

// Initialiser le suivi de page
trackPageView();

// Initialiser le statut online/offline
initOnlineStatus();

// ===== SERVICE WORKER POUR PWA =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker enregistré avec succès:', registration.scope);
            })
            .catch(error => {
                console.log('Échec enregistrement ServiceWorker:', error);
            });
    });
}

// ===== GESTION DE LA SESSION =====
function checkSessionTimeout() {
    const lastActivity = localStorage.getItem('payfusion_last_activity');
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes
    
    if (lastActivity) {
        const now = Date.now();
        const timeSinceLastActivity = now - parseInt(lastActivity, 10);
        
        if (timeSinceLastActivity > sessionTimeout) {
            // Session expirée
            localStorage.removeItem('payfusion_auth_token');
            localStorage.removeItem('payfusion_user_data');
            window.location.href = 'login.html?session=expired';
        }
    }
    
    // Mettre à jour le timestamp d'activité
    localStorage.setItem('payfusion_last_activity', Date.now().toString());
}

// Vérifier le timeout de session toutes les minutes
setInterval(checkSessionTimeout, 60000);

// Mettre à jour l'activité au chargement de la page et lors des interactions
document.addEventListener('click', checkSessionTimeout);
document.addEventListener('keypress', checkSessionTimeout);