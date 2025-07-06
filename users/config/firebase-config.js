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
if (typeof firebase !== 'undefined') {
    if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized from firebase-config.js');
    } else {
        console.log('Firebase already initialized (from firebase-config.js)');
    }
} else {
    console.error('Firebase SDK not loaded! Make sure to include the Firebase SDK before this file.');
}