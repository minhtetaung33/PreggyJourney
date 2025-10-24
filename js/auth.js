import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase.js';
import { elements, showMainApp, showHeroSection, closeAuthModal, openAuthModal } from './ui.js';
import { loadAllDataForUser, unloadAllData } from './main.js';

let userId = null;

function setupAuthentication() {
    onAuthStateChanged(auth, async user => {
        if (user) {
            userId = user.uid;
            elements.userNameEl.textContent = user.displayName.split(' ')[0];
            showMainApp();
            loadAllDataForUser(userId);
        } else {
            userId = null;
            showHeroSection();
            unloadAllData();
        }
    });

    elements.signUpBtn.addEventListener('click', openAuthModal);
    elements.googleSignInBtn.addEventListener('click', () => {
        signInWithGoogle();
        closeAuthModal();
    });
    elements.signOutBtn.addEventListener('click', doSignOut);
    elements.authModalCloseBtn.addEventListener('click', closeAuthModal);
    elements.authModal.addEventListener('click', (e) => e.target === elements.authModal && closeAuthModal());
}

const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => {
        console.error("Google Sign-In Error:", error);
    });
};

const doSignOut = () => {
    signOut(auth).catch(error => {
        console.error("Sign Out Error:", error);
    });
};

function getCurrentUserId() {
    return userId;
}

export { setupAuthentication, getCurrentUserId };
