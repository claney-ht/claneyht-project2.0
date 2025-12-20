// ============================================
// PAYFUSION - CONFIGURATION EMAILJS
// Configuration réelle pour l'envoi d'emails
// ============================================

// Configuration EmailJS (VOS IDENTIFIANTS)
const EMAILJS_CONFIG = {
    // Service ID - À remplacer par votre Service ID
    SERVICE_ID: 'service_payfusion',
    
    // User ID - À remplacer par votre Public Key
    USER_ID: 'YOUR_PUBLIC_KEY_HERE',
    
    // Template IDs - À configurer dans votre compte EmailJS
    TEMPLATES: {
        // Inscription et bienvenue
        WELCOME: 'template_welcome_user',
        EMAIL_VERIFICATION: 'template_email_verify',
        REGISTRATION_COMPLETE: 'template_registration_complete',
        
        // KYC et vérification
        KYC_SUBMITTED: 'template_kyc_submitted',
        KYC_APPROVED: 'template_kyc_approved',
        KYC_REJECTED: 'template_kyc_rejected',
        
        // Transactions financières
        DEPOSIT_RECEIVED: 'template_deposit_received',
        DEPOSIT_VERIFIED: 'template_deposit_verified',
        WITHDRAWAL_REQUESTED: 'template_withdrawal_requested',
        WITHDRAWAL_PROCESSED: 'template_withdrawal_processed',
        WITHDRAWAL_REJECTED: 'template_withdrawal_rejected',
        
        // Commandes et services
        ORDER_PLACED: 'template_order_placed',
        ORDER_PROCESSING: 'template_order_processing',
        ORDER_COMPLETED: 'template_order_completed',
        ORDER_CANCELLED: 'template_order_cancelled',
        
        // Sécurité du compte
        PASSWORD_CHANGED: 'template_password_changed',
        NEW_LOGIN: 'template_new_login',
        SUSPICIOUS_ACTIVITY: 'template_suspicious_activity',
        ACCOUNT_LOCKED: 'template_account_locked',
        
        // Support client
        SUPPORT_TICKET_CREATED: 'template_support_ticket_created',
        SUPPORT_RESPONSE: 'template_support_response',
        SUPPORT_RESOLVED: 'template_support_resolved',
        
        // Notifications système
        BALANCE_LOW: 'template_balance_low',
        PAYMENT_REMINDER: 'template_payment_reminder',
        SUBSCRIPTION_RENEWAL: 'template_subscription_renewal',
        
        // Marketing et promotions
        NEWSLETTER: 'template_newsletter',
        PROMOTIONAL_OFFER: 'template_promotional_offer',
        REFERRAL_BONUS: 'template_referral_bonus',
        
        // Administration
        ADMIN_ALERT_NEW_KYC: 'template_admin_new_kyc',
        ADMIN_ALERT_NEW_ORDER: 'template_admin_new_order',
        ADMIN_ALERT_NEW_DEPOSIT: 'template_admin_new_deposit',
        ADMIN_ALERT_NEW_WITHDRAWAL: 'template_admin_new_withdrawal',
        ADMIN_ALERT_SYSTEM_ISSUE: 'template_admin_system_issue'
    },
    
    // Adresses email
    EMAILS: {
        SUPPORT: 'support.payfusion@gmail.com',
        ADMIN: 'payfusion@admin.com',
        NO_REPLY: 'noreply@payfusion.com',
        BILLING: 'billing@payfusion.com'
    },
    
    // Paramètres d'envoi
    SETTINGS: {
        MAX_RETRIES: 3,
        TIMEOUT: 10000, // 10 secondes
        ENABLE_LOGGING: true,
        USE_SSL: true
    }
};

// ============================================
// FONCTIONS PRINCIPALES D'ENVOI
// ============================================

/**
 * Initialiser EmailJS
 * @returns {boolean} Succès de l'initialisation
 */
function initEmailJS() {
    try {
        // Vérifier si EmailJS est chargé
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS non chargé. Vérifiez le script dans le HTML.');
            return false;
        }
        
        // Initialiser avec l'User ID
        emailjs.init(EMAILJS_CONFIG.USER_ID);
        
        console.log('✅ EmailJS initialisé avec succès');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur d\'initialisation EmailJS:', error);
        return false;
    }
}

/**
 * Envoyer un email avec EmailJS
 * @param {string} templateId - ID du template
 * @param {Object} templateParams - Paramètres du template
 * @param {string} toEmail - Email du destinataire
 * @param {string} toName - Nom du destinataire (optionnel)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendEmail(templateId, templateParams, toEmail, toName = '') {
    try {
        // Vérifier l'initialisation
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS non initialisé');
        }
        
        // Valider les paramètres
        if (!templateId || !toEmail) {
            throw new Error('Template ID et email destinataire requis');
        }
        
        if (!isValidEmail(toEmail)) {
            throw new Error('Email destinataire invalide');
        }
        
        // Préparer les données d'envoi
        const emailData = {
            to_email: toEmail,
            to_name: toName || toEmail.split('@')[0],
            from_name: 'PayFusion',
            reply_to: EMAILJS_CONFIG.EMAILS.SUPPORT,
            ...templateParams
        };
        
        // Journaliser l'envoi (si activé)
        if (EMAILJS_CONFIG.SETTINGS.ENABLE_LOGGING) {
            console.log(`📧 Envoi email: ${templateId} à ${toEmail}`);
        }
        
        // Envoyer l'email avec retry
        let lastError;
        
        for (let attempt = 1; attempt <= EMAILJS_CONFIG.SETTINGS.MAX_RETRIES; attempt++) {
            try {
                const response = await emailjs.send(
                    EMAILJS_CONFIG.SERVICE_ID,
                    templateId,
                    emailData,
                    EMAILJS_CONFIG.USER_ID
                );
                
                // Succès
                if (EMAILJS_CONFIG.SETTINGS.ENABLE_LOGGING) {
                    console.log(`✅ Email envoyé avec succès: ${templateId}`, response);
                }
                
                // Journaliser dans Firestore (si disponible)
                await logEmailSent(templateId, toEmail, true, null);
                
                return {
                    success: true,
                    message: 'Email envoyé avec succès',
                    response: response,
                    templateId: templateId,
                    toEmail: toEmail
                };
                
            } catch (error) {
                lastError = error;
                
                if (EMAILJS_CONFIG.SETTINGS.ENABLE_LOGGING) {
                    console.warn(`⚠️ Tentative ${attempt} échouée:`, error);
                }
                
                // Attendre avant de réessayer (backoff exponentiel)
                if (attempt < EMAILJS_CONFIG.SETTINGS.MAX_RETRIES) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // Toutes les tentatives ont échoué
        throw lastError;
        
    } catch (error) {
        console.error('❌ Erreur d\'envoi d\'email:', error);
        
        // Journaliser l'échec
        await logEmailSent(templateId, toEmail, false, error.message);
        
        return {
            success: false,
            error: error.message || 'Erreur d\'envoi d\'email',
            templateId: templateId,
            toEmail: toEmail
        };
    }
}

// ============================================
// TEMPLATES EMAIL SPÉCIFIQUES PAYFUSION
// ============================================

/**
 * Envoyer l'email de bienvenue
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendWelcomeEmail(userEmail, userName) {
    const templateParams = {
        user_name: userName,
        login_email: userEmail,
        support_email: EMAILJS_CONFIG.EMAILS.SUPPORT,
        whatsapp_number: '+50939442808',
        current_date: new Date().toLocaleDateString('fr-FR'),
        year: new Date().getFullYear()
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.WELCOME,
        templateParams,
        userEmail,
        userName
    );
}

/**
 * Envoyer l'email de vérification
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} verificationLink - Lien de vérification
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendVerificationEmail(userEmail, userName, verificationLink) {
    const templateParams = {
        user_name: userName,
        verification_link: verificationLink,
        verification_code: generateVerificationCode(),
        expiry_time: '24 heures',
        support_email: EMAILJS_CONFIG.EMAILS.SUPPORT
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.EMAIL_VERIFICATION,
        templateParams,
        userEmail,
        userName
    );
}

/**
 * Envoyer la notification de dépôt reçu
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {Object} depositData - Données du dépôt
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendDepositReceivedEmail(userEmail, userName, depositData) {
    const templateParams = {
        user_name: userName,
        deposit_amount: formatCurrency(depositData.amount, depositData.currency),
        deposit_method: depositData.method,
        transaction_id: depositData.transactionId,
        date_time: new Date().toLocaleString('fr-FR'),
        estimated_completion: '10-30 minutes',
        new_balance: formatCurrency(depositData.newBalance, 'HTG'),
        support_email: EMAILJS_CONFIG.EMAILS.SUPPORT
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.DEPOSIT_RECEIVED,
        templateParams,
        userEmail,
        userName
    );
}

/**
 * Envoyer la notification de dépôt vérifié
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {Object} depositData - Données du dépôt
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendDepositVerifiedEmail(userEmail, userName, depositData) {
    const templateParams = {
        user_name: userName,
        deposit_amount: formatCurrency(depositData.amount, depositData.currency),
        deposit_method: depositData.method,
        transaction_id: depositData.transactionId,
        date_time: new Date().toLocaleString('fr-FR'),
        new_balance: formatCurrency(depositData.newBalance, 'HTG'),
        completion_time: depositData.completionTime || '25 minutes'
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.DEPOSIT_VERIFIED,
        templateParams,
        userEmail,
        userName
    );
}

/**
 * Envoyer la notification de commande
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {Object} orderData - Données de la commande
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendOrderConfirmationEmail(userEmail, userName, orderData) {
    const templateParams = {
        user_name: userName,
        order_number: orderData.orderNumber,
        order_date: new Date().toLocaleDateString('fr-FR'),
        service_type: orderData.serviceType,
        items: formatOrderItems(orderData.items),
        total_amount: formatCurrency(orderData.totalAmount, 'HTG'),
        estimated_delivery: getEstimatedDelivery(orderData.serviceType),
        support_email: EMAILJS_CONFIG.EMAILS.SUPPORT,
        whatsapp_number: '+50939442808'
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.ORDER_PLACED,
        templateParams,
        userEmail,
        userName
    );
}

/**
 * Envoyer la notification KYC soumise
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendKYCSubmittedEmail(userEmail, userName) {
    const templateParams = {
        user_name: userName,
        submission_date: new Date().toLocaleDateString('fr-FR'),
        review_timeframe: '24-48 heures',
        support_email: EMAILJS_CONFIG.EMAILS.SUPPORT
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.KYC_SUBMITTED,
        templateParams,
        userEmail,
        userName
    );
}

/**
 * Envoyer la notification KYC approuvée
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendKYCApprovedEmail(userEmail, userName) {
    const templateParams = {
        user_name: userName,
        approval_date: new Date().toLocaleDateString('fr-FR'),
        new_limits: 'Dépôt: 50,000 HTG/jour, Retrait: 25,000 HTG/jour',
        benefits: 'Accès complet à tous les services',
        support_email: EMAILJS_CONFIG.EMAILS.SUPPORT
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.KYC_APPROVED,
        templateParams,
        userEmail,
        userName
    );
}

/**
 * Envoyer la notification KYC rejetée
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} rejectionReason - Raison du rejet
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendKYCRejectedEmail(userEmail, userName, rejectionReason) {
    const templateParams = {
        user_name: userName,
        rejection_date: new Date().toLocaleDateString('fr-FR'),
        rejection_reason: rejectionReason,
        next_steps: 'Veuillez soumettre à nouveau des documents valides',
        support_email: EMAILJS_CONFIG.EMAILS.SUPPORT,
        whatsapp_number: '+50939442808'
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.KYC_REJECTED,
        templateParams,
        userEmail,
        userName
    );
}

/**
 * Envoyer l'alerte de nouvelle connexion
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {Object} loginData - Données de connexion
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendNewLoginAlertEmail(userEmail, userName, loginData) {
    const templateParams = {
        user_name: userName,
        login_time: new Date().toLocaleString('fr-FR'),
        login_device: loginData.device || 'Appareil inconnu',
        login_location: loginData.location || 'Localisation inconnue',
        login_ip: loginData.ipAddress || 'IP non disponible',
        if_not_you_link: 'https://payfusion.com/security',
        support_email: EMAILJS_CONFIG.EMAILS.SUPPORT
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.NEW_LOGIN,
        templateParams,
        userEmail,
        userName
    );
}

/**
 * Envoyer la notification de retrait traité
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 * @param {Object} withdrawalData - Données du retrait
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendWithdrawalProcessedEmail(userEmail, userName, withdrawalData) {
    const templateParams = {
        user_name: userName,
        withdrawal_amount: formatCurrency(withdrawalData.amount, 'HTG'),
        withdrawal_method: withdrawalData.method,
        transaction_id: withdrawalData.transactionId,
        processing_time: withdrawalData.processingTime || '2 heures',
        new_balance: formatCurrency(withdrawalData.newBalance, 'HTG'),
        recipient_info: withdrawalData.recipientInfo || 'Non spécifié',
        date_time: new Date().toLocaleString('fr-FR')
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.WITHDRAWAL_PROCESSED,
        templateParams,
        userEmail,
        userName
    );
}

// ============================================
// NOTIFICATIONS ADMINISTRATEUR
// ============================================

/**
 * Envoyer l'alerte admin pour nouvelle soumission KYC
 * @param {Object} kycData - Données KYC
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendAdminKYCAlert(kycData) {
    const templateParams = {
        user_name: kycData.userName,
        user_email: kycData.userEmail,
        user_id: kycData.userId,
        submission_date: new Date().toLocaleString('fr-FR'),
        kyc_type: kycData.kycType || 'Complet',
        admin_link: 'https://admin.payfusion.com/kyc',
        documents_count: kycData.documentsCount || 3
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.ADMIN_ALERT_NEW_KYC,
        templateParams,
        EMAILJS_CONFIG.EMAILS.ADMIN,
        'Administrateur PayFusion'
    );
}

/**
 * Envoyer l'alerte admin pour nouvelle commande
 * @param {Object} orderData - Données de commande
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendAdminOrderAlert(orderData) {
    const templateParams = {
        order_number: orderData.orderNumber,
        user_email: orderData.userEmail,
        user_name: orderData.userName,
        service_type: orderData.serviceType,
        total_amount: formatCurrency(orderData.totalAmount, 'HTG'),
        order_date: new Date().toLocaleString('fr-FR'),
        admin_link: 'https://admin.payfusion.com/orders',
        items_count: orderData.itemsCount || 1
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.ADMIN_ALERT_NEW_ORDER,
        templateParams,
        EMAILJS_CONFIG.EMAILS.ADMIN,
        'Administrateur PayFusion'
    );
}

/**
 * Envoyer l'alerte admin pour nouveau dépôt
 * @param {Object} depositData - Données de dépôt
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendAdminDepositAlert(depositData) {
    const templateParams = {
        user_email: depositData.userEmail,
        user_name: depositData.userName,
        deposit_amount: formatCurrency(depositData.amount, depositData.currency),
        deposit_method: depositData.method,
        transaction_id: depositData.transactionId,
        date_time: new Date().toLocaleString('fr-FR'),
        admin_link: 'https://admin.payfusion.com/transactions',
        proof_attached: depositData.hasProof ? 'Oui' : 'Non'
    };
    
    return await sendEmail(
        EMAILJS_CONFIG.TEMPLATES.ADMIN_ALERT_NEW_DEPOSIT,
        templateParams,
        EMAILJS_CONFIG.EMAILS.ADMIN,
        'Administrateur PayFusion'
    );
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Valider un email
 * @param {string} email - Email à valider
 * @returns {boolean} Email valide ou non
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Formater une valeur monétaire
 * @param {number} amount - Montant
 * @param {string} currency - Devise
 * @returns {string} Montant formaté
 */
function formatCurrency(amount, currency = 'HTG') {
    const formatter = new Intl.NumberFormat('fr-HT', {
        style: 'currency',
        currency: currency === 'USD' ? 'USD' : 'HTG',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
}

/**
 * Générer un code de vérification
 * @returns {string} Code de 6 chiffres
 */
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Formater les articles de commande
 * @param {Array} items - Articles de commande
 * @returns {string} Articles formatés
 */
function formatOrderItems(items) {
    if (!items || !Array.isArray(items)) return 'Non spécifié';
    
    return items.map(item => {
        if (typeof item === 'string') return item;
        if (item.name && item.quantity) {
            return `${item.name} x${item.quantity}`;
        }
        return JSON.stringify(item);
    }).join(', ');
}

/**
 * Obtenir le délai de livraison estimé
 * @param {string} serviceType - Type de service
 * @returns {string} Délai estimé
 */
function getEstimatedDelivery(serviceType) {
    const deliveries = {
        'freefire': '5-15 minutes',
        'netflix': 'Instantané',
        'wise': '10-30 minutes',
        'paypal': '10-30 minutes',
        'usdt': '10-30 minutes'
    };
    
    return deliveries[serviceType] || '10-30 minutes';
}

/**
 * Journaliser l'envoi d'email
 * @param {string} templateId - ID du template
 * @param {string} toEmail - Email destinataire
 * @param {boolean} success - Succès de l'envoi
 * @param {string} errorMessage - Message d'erreur (si échec)
 */
async function logEmailSent(templateId, toEmail, success, errorMessage = null) {
    try {
        // Si Firebase est disponible, journaliser dans Firestore
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const logEntry = {
                templateId: templateId,
                toEmail: toEmail,
                success: success,
                errorMessage: errorMessage,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent
            };
            
            await firebase.firestore().collection('email_logs').add(logEntry);
        }
    } catch (error) {
        console.error('Erreur de journalisation d\'email:', error);
    }
}

/**
 * Tester la configuration EmailJS
 * @returns {Promise<Object>} Résultat du test
 */
async function testEmailJSConfig() {
    console.log('🧪 Test de configuration EmailJS...');
    
    // Vérifier les configurations requises
    const missingConfigs = [];
    
    if (!EMAILJS_CONFIG.SERVICE_ID || EMAILJS_CONFIG.SERVICE_ID === 'service_payfusion') {
        missingConfigs.push('SERVICE_ID');
    }
    
    if (!EMAILJS_CONFIG.USER_ID || EMAILJS_CONFIG.USER_ID === 'YOUR_PUBLIC_KEY_HERE') {
        missingConfigs.push('USER_ID (Public Key)');
    }
    
    if (missingConfigs.length > 0) {
        return {
            success: false,
            error: `Configuration manquante: ${missingConfigs.join(', ')}`,
            instructions: 'Veuillez configurer vos identifiants EmailJS dans emailjs-config.js'
        };
    }
    
    // Tester l'initialisation
    if (!initEmailJS()) {
        return {
            success: false,
            error: 'Échec d\'initialisation EmailJS'
        };
    }
    
    return {
        success: true,
        message: 'Configuration EmailJS valide',
        serviceId: EMAILJS_CONFIG.SERVICE_ID,
        templatesCount: Object.keys(EMAILJS_CONFIG.TEMPLATES).length
    };
}

// ============================================
// EXPORT DES FONCTIONS
// ============================================

// Export de la configuration
export { EMAILJS_CONFIG };

// Export des fonctions principales
export {
    initEmailJS,
    sendEmail,
    testEmailJSConfig
};

// Export des fonctions spécifiques
export {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendDepositReceivedEmail,
    sendDepositVerifiedEmail,
    sendOrderConfirmationEmail,
    sendKYCSubmittedEmail,
    sendKYCApprovedEmail,
    sendKYCRejectedEmail,
    sendNewLoginAlertEmail,
    sendWithdrawalProcessedEmail
};

// Export des fonctions admin
export {
    sendAdminKYCAlert,
    sendAdminOrderAlert,
    sendAdminDepositAlert
};

// Export des fonctions utilitaires
export {
    isValidEmail,
    formatCurrency,
    generateVerificationCode,
    formatOrderItems,
    getEstimatedDelivery
};

// Initialisation automatique
if (typeof window !== 'undefined') {
    // Tester la configuration au chargement
    window.addEventListener('load', async () => {
        const testResult = await testEmailJSConfig();
        
        if (testResult.success) {
            console.log('✅ EmailJS configuré avec succès');
            console.log(`📧 Templates disponibles: ${testResult.templatesCount}`);
        } else {
            console.warn('⚠️ EmailJS nécessite une configuration:', testResult.error);
            console.info('💡 Instructions:', testResult.instructions);
        }
    });
}

// ============================================
// INSTRUCTIONS DE CONFIGURATION
// ============================================

/*
INSTRUCTIONS POUR CONFIGURER EMAILJS :

1. Créer un compte sur https://www.emailjs.com/
2. Récupérer votre "Public Key" (User ID) et "Service ID"
3. Créer les templates suivants dans votre compte EmailJS :

LISTE DES TEMPLATES REQUIS :

1. Welcome User (template_welcome_user)
   Variables: {{user_name}}, {{login_email}}, {{support_email}}, {{whatsapp_number}}

2. Email Verification (template_email_verify)
   Variables: {{user_name}}, {{verification_link}}, {{verification_code}}, {{expiry_time}}

3. Deposit Received (template_deposit_received)
   Variables: {{user_name}}, {{deposit_amount}}, {{deposit_method}}, {{transaction_id}}, {{estimated_completion}}

4. Order Confirmation (template_order_placed)
   Variables: {{user_name}}, {{order_number}}, {{service_type}}, {{total_amount}}, {{estimated_delivery}}

5. KYC Submitted (template_kyc_submitted)
   Variables: {{user_name}}, {{submission_date}}, {{review_timeframe}}

6. New Login Alert (template_new_login)
   Variables: {{user_name}}, {{login_time}}, {{login_device}}, {{login_location}}

7. Admin Alert - New KYC (template_admin_new_kyc)
   Variables: {{user_name}}, {{user_email}}, {{submission_date}}, {{admin_link}}

8. Admin Alert - New Order (template_admin_new_order)
   Variables: {{order_number}}, {{user_email}}, {{service_type}}, {{total_amount}}, {{admin_link}}

... et les autres templates listés dans TEMPLATES

4. Remplacer dans ce fichier :
   - SERVICE_ID: par votre Service ID
   - USER_ID: par votre Public Key

5. Tester l'envoi avec la fonction testEmailJSConfig()
*/