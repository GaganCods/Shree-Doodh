/**
 * Auth Protection Script
 * This script prevents unauthorized access to user pages.
 * It should be included in all pages within the users/ directory.
 */

// IMMEDIATE: Preload user data from localStorage for instant display
preloadUserData();

// Preload user data from localStorage to make it available immediately
function preloadUserData() {
  try {
    const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
    
    if (userData && (userData.fullName || userData.displayName)) {
      // We have user data in localStorage, update UI immediately
      console.log('Preloading user data from localStorage');
      
      // Update user name elements immediately
      updateElementIfExists('#sidebarUserName', userData.fullName || userData.displayName || 'User');
      updateElementIfExists('#dropdownUserName', userData.fullName || userData.displayName || 'User');
      
      // Update user email elements
      updateElementIfExists('#sidebarUserEmail', userData.email || '');
      updateElementIfExists('#dropdownUserEmail', userData.email || '');
    }
  } catch (error) {
    console.error('Error preloading user data:', error);
  }
}

// Helper function to update element text content if it exists
function updateElementIfExists(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

// Check if user is authenticated
function checkAuth() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      // No user is signed in, redirect to login page
      console.log("User not authenticated. Redirecting to login...");
      
      // Get current path
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on auth pages
      if (!currentPath.includes('/auth/')) {
        // Store the intended destination for after login
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        
        // Redirect to login
        window.location.href = getRelativePath() + 'auth/login.html';
      }
    } else {
      console.log("User authenticated:", user.email);
    }
  });
}

// Helper function to get relative path to auth folder
function getRelativePath() {
  const path = window.location.pathname;
  const depth = (path.match(/\//g) || []).length - 1;
  
  // If in users/ root, return empty string
  if (path.endsWith('/users/') || path.endsWith('/users/index.html') || path.endsWith('/users/dashboard.html')) {
    return '';
  }
  
  // If in users/pages/, return '../'
  if (path.includes('/users/pages/')) {
    return '../';
  }
  
  // Default to current directory
  return './';
}

// Run auth check when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    try {
      const firebaseConfig = {
        // Firebase config should be loaded from firebase-config.js
      };
      firebase.initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Firebase initialization error:", e);
    }
  }
  
  // Check authentication
  checkAuth();
}); 