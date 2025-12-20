// ============================================
// PAYFUSION - CONFIGURATION FIREBASE
// Configuration réelle avec vos clés API
// ============================================

// Configuration Firebase (VOS CLÉS)
const firebaseConfig = {
    apiKey: "AIzaSyB5_KighCQRfslRjZtGZPxs3OUqqQRk7IE",
    authDomain: "pay-fusion-26a79.firebaseapp.com",
    projectId: "pay-fusion-26a79",
    storageBucket: "pay-fusion-26a79.firebasestorage.app",
    messagingSenderId: "771406909196",
    appId: "1:771406909196:web:27bdf4db07ad8d08418329",
    measurementId: "G-XXXXXXXXXX" // À ajouter si disponible
};

// Initialisation Firebase
try {
    // Vérifier si Firebase est déjà initialisé
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialisé avec succès");
    } else {
        firebase.app(); // Utiliser l'instance existante
    }
} catch (error) {
    console.error("❌ Erreur d'initialisation Firebase:", error);
    throw error;
}

// Services Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const functions = firebase.functions();
const analytics = firebase.analytics();

// Configuration Firestore
db.settings({
    timestampsInSnapshots: true,
    merge: true
});

// ============================================
// COLLECTIONS FIRESTORE
// ============================================

const COLLECTIONS = {
    // Utilisateurs
    USERS: 'users',
    USER_PROFILES: 'user_profiles',
    USER_SETTINGS: 'user_settings',
    
    // Transactions financières
    TRANSACTIONS: 'transactions',
    DEPOSITS: 'deposits',
    WITHDRAWALS: 'withdrawals',
    
    // Commandes
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items',
    
    // Services
    SERVICES: 'services',
    SERVICE_CATEGORIES: 'service_categories',
    
    // KYC & Vérification
    KYC_SUBMISSIONS: 'kyc_submissions',
    KYC_DOCUMENTS: 'kyc_documents',
    
    // Support
    SUPPORT_TICKETS: 'support_tickets',
    SUPPORT_MESSAGES: 'support_messages',
    
    // Notifications
    NOTIFICATIONS: 'notifications',
    USER_NOTIFICATIONS: 'user_notifications',
    
    // Système
    SYSTEM_LOGS: 'system_logs',
    APP_SETTINGS: 'app_settings',
    CURRENCY_RATES: 'currency_rates'
};

// ============================================
// FONCTIONS D'AUTHENTIFICATION
// ============================================

/**
 * Inscrire un nouvel utilisateur
 * @param {Object} userData - Données utilisateur
 * @returns {Promise<Object>} Résultat de l'inscription
 */
async function registerUser(userData) {
    try {
        // 1. Créer le compte d'authentification
        const userCredential = await auth.createUserWithEmailAndPassword(
            userData.email,
            userData.password
        );
        
        const user = userCredential.user;
        
        // 2. Envoyer l'email de vérification
        await user.sendEmailVerification();
        
        // 3. Créer le profil utilisateur dans Firestore
        const userProfile = {
            uid: user.uid,
            email: userData.email,
            phone: userData.phone,
            firstName: userData.firstName,
            lastName: userData.lastName,
            birthDate: userData.birthDate,
            country: 'Haiti',
            city: userData.city || '',
            address: userData.address || '',
            
            // Statuts
            emailVerified: false,
            phoneVerified: false,
            kycStatus: 'not_submitted', // not_submitted, pending, approved, rejected
            accountStatus: 'active', // active, suspended, banned
            accountLevel: 'basic', // basic, verified, premium
            
            // Solde et limites
            balance: 0,
            balanceHTG: 0,
            balanceUSD: 0,
            balanceUSDT: 0,
            
            transactionLimits: {
                dailyDeposit: 10000,
                dailyWithdrawal: 5000,
                monthlyDeposit: 50000,
                monthlyWithdrawal: 25000
            },
            
            // Métadonnées
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            registrationIp: userData.ipAddress || '',
            referralCode: generateReferralCode(),
            referredBy: userData.referralCode || null
        };
        
        // 4. Sauvegarder le profil
        await db.collection(COLLECTIONS.USERS).doc(user.uid).set(userProfile);
        
        // 5. Créer les paramètres par défaut
        const userSettings = {
            uid: user.uid,
            notifications: {
                email: true,
                push: true,
                whatsapp: true,
                transactionAlerts: true,
                marketing: false
            },
            security: {
                twoFactorAuth: false,
                loginAlerts: true,
                sessionTimeout: 30
            },
            language: 'fr',
            currency: 'HTG',
            theme: 'light'
        };
        
        await db.collection(COLLECTIONS.USER_SETTINGS).doc(user.uid).set(userSettings);
        
        // 6. Journaliser l'inscription
        await logSystemEvent('USER_REGISTERED', {
            userId: user.uid,
            email: userData.email,
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            user: user,
            profile: userProfile,
            message: 'Compte créé avec succès. Veuillez vérifier votre email.'
        };
        
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        
        // Gestion des erreurs spécifiques
        let errorMessage = 'Erreur lors de l\'inscription';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Cet email est déjà utilisé';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email invalide';
                break;
            case 'auth/weak-password':
                errorMessage = 'Mot de passe trop faible';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'L\'inscription par email est désactivée';
                break;
        }
        
        return {
            success: false,
            error: errorMessage,
            code: error.code
        };
    }
}

/**
 * Connecter un utilisateur
 * @param {string} emailOrPhone - Email ou téléphone
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Résultat de la connexion
 */
async function loginUser(emailOrPhone, password) {
    try {
        let userCredential;
        
        // Déterminer si c'est un email ou téléphone
        const isEmail = emailOrPhone.includes('@');
        
        if (isEmail) {
            // Connexion par email
            userCredential = await auth.signInWithEmailAndPassword(emailOrPhone, password);
        } else {
            // Pour téléphone, besoin de trouver l'email associé
            const userQuery = await db.collection(COLLECTIONS.USERS)
                .where('phone', '==', emailOrPhone)
                .limit(1)
                .get();
            
            if (userQuery.empty) {
                throw new Error('Numéro de téléphone non trouvé');
            }
            
            const userDoc = userQuery.docs[0];
            const userEmail = userDoc.data().email;
            
            userCredential = await auth.signInWithEmailAndPassword(userEmail, password);
        }
        
        const user = userCredential.user;
        
        // Mettre à jour la dernière connexion
        await db.collection(COLLECTIONS.USERS).doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Journaliser la connexion
        await logSystemEvent('USER_LOGIN', {
            userId: user.uid,
            timestamp: new Date().toISOString(),
            method: isEmail ? 'email' : 'phone'
        });
        
        return {
            success: true,
            user: user,
            message: 'Connexion réussie'
        };
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        
        let errorMessage = 'Erreur lors de la connexion';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Utilisateur non trouvé';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Mot de passe incorrect';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email invalide';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Compte désactivé';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Trop de tentatives. Réessayez plus tard';
                break;
        }
        
        return {
            success: false,
            error: errorMessage,
            code: error.code
        };
    }
}

/**
 * Déconnecter l'utilisateur
 * @returns {Promise<Object>} Résultat de la déconnexion
 */
async function logoutUser() {
    try {
        await auth.signOut();
        
        // Journaliser la déconnexion
        await logSystemEvent('USER_LOGOUT', {
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            message: 'Déconnexion réussie'
        };
        
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        return {
            success: false,
            error: 'Erreur lors de la déconnexion'
        };
    }
}

/**
 * Réinitialiser le mot de passe
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise<Object>} Résultat de la réinitialisation
 */
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        
        // Journaliser la demande
        await logSystemEvent('PASSWORD_RESET_REQUESTED', {
            email: email,
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            message: 'Email de réinitialisation envoyé'
        };
        
    } catch (error) {
        console.error('Erreur de réinitialisation:', error);
        
        let errorMessage = 'Erreur lors de la réinitialisation';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Utilisateur non trouvé';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email invalide';
                break;
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Vérifier l'état d'authentification
 * @returns {Promise<Object>} État de l'authentification
 */
function checkAuthState() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                resolve({ 
                    isLoggedIn: true, 
                    user: user,
                    uid: user.uid 
                });
            } else {
                resolve({ 
                    isLoggedIn: false, 
                    user: null,
                    uid: null 
                });
            }
        });
    });
}

/**
 * Récupérer le profil utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Profil utilisateur
 */
async function getUserProfile(userId) {
    try {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        
        if (!userDoc.exists) {
            throw new Error('Profil utilisateur non trouvé');
        }
        
        return {
            success: true,
            profile: userDoc.data()
        };
        
    } catch (error) {
        console.error('Erreur de récupération du profil:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Mettre à jour le profil utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Résultat de la mise à jour
 */
async function updateUserProfile(userId, updates) {
    try {
        // Ajouter la date de mise à jour
        updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection(COLLECTIONS.USERS).doc(userId).update(updates);
        
        // Journaliser la mise à jour
        await logSystemEvent('USER_PROFILE_UPDATED', {
            userId: userId,
            updates: Object.keys(updates),
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            message: 'Profil mis à jour avec succès'
        };
        
    } catch (error) {
        console.error('Erreur de mise à jour du profil:', error);
        return {
            success: false,
            error: 'Erreur lors de la mise à jour du profil'
        };
    }
}

/**
 * Générer un code de référence
 * @returns {string} Code de référence
 */
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REF-';
    
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
}

/**
 * Journaliser un événement système
 * @param {string} eventType - Type d'événement
 * @param {Object} data - Données de l'événement
 */
async function logSystemEvent(eventType, data) {
    try {
        const logEntry = {
            eventType: eventType,
            ...data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
        
        await db.collection(COLLECTIONS.SYSTEM_LOGS).add(logEntry);
        
    } catch (error) {
        console.error('Erreur de journalisation:', error);
    }
}

// ============================================
// EXPORT DES SERVICES ET FONCTIONS
// ============================================

// Export des services Firebase
export {
    auth,
    db,
    storage,
    functions,
    analytics,
    firebase
};

// Export des collections
export { COLLECTIONS };

// Export des fonctions d'authentification
export {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    checkAuthState,
    getUserProfile,
    updateUserProfile
};

// Export des fonctions utilitaires
export {
    generateReferralCode,
    logSystemEvent
};

// Export de la configuration
export { firebaseConfig };

// Initialisation automatique pour les pages HTML
if (typeof window !== 'undefined') {
    window.firebaseApp = {
        auth,
        db,
        storage,
        functions,
        COLLECTIONS,
        registerUser,
        loginUser,
        logoutUser,
        resetPassword,
        checkAuthState,
        getUserProfile,
        updateUserProfile
    };
    
    console.log('🔥 Firebase configuré pour PayFusion');
}

// ============================================
// RÈGLES DE SÉCURITÉ RECOMMANDÉES (À COPIER DANS FIREBASE CONSOLE)
// ============================================

/*
// Règles Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les utilisateurs
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Règles pour les transactions
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/transactions/$(transactionId)).data().userId == request.auth.uid;
    }
    
    // Règles pour les commandes
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/orders/$(orderId)).data().userId == request.auth.uid;
    }
    
    // Règles pour les soumissions KYC (admin seulement)
    match /kyc_submissions/{submissionId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
  
  // Fonction de vérification admin
  function isAdmin() {
    return request.auth.token.email == 'payfusion@admin.com';
  }
}

// Règles Storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /kyc/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/