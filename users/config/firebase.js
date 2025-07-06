// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDCjrTCIpiAtBEp9lYkem7ZUuboUp6jAcI",
    authDomain: "quick-solve-pro.firebaseapp.com",
    databaseURL: "https://quick-solve-pro-default-rtdb.firebaseio.com",
    projectId: "quick-solve-pro",
    storageBucket: "quick-solve-pro.firebasestorage.app",
    messagingSenderId: "291461354213",
    appId: "1:291461354213:web:9ec4753d9b957b242c7a0c"
};

// Check if Firebase is already initialized
if (!firebase.apps || !firebase.apps.length) {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized');
} else {
    console.log('Firebase already initialized');
}

// Initialize Firebase Authentication
const auth = firebase.auth();

// Initialize Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Make auth functions available globally
window.auth = auth;
window.googleProvider = googleProvider;
window.signInWithEmailAndPassword = firebase.auth().signInWithEmailAndPassword;
window.createUserWithEmailAndPassword = firebase.auth().createUserWithEmailAndPassword;
window.signInWithPopup = firebase.auth().signInWithPopup;
window.onAuthStateChanged = firebase.auth().onAuthStateChanged;

// Set up auth state change listener
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        
        // Update last login timestamp in database
        const uid = user.uid;
        const lastLogin = new Date().toISOString();
        firebase.database().ref("users/" + uid + "/lastLogin").set(lastLogin)
            .catch(error => console.error("Error updating last login:", error));
    } else {
        // User is signed out
        console.log('No user is signed in');
    }
});

console.log('Firebase auth setup complete'); 