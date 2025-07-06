/**
 * User Profile Loader
 * This script loads user profile data from Firebase Realtime Database
 * and updates UI elements across the site.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase if not already initialized
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded!');
    return;
  }
  
  // IMMEDIATE: First load from localStorage for instant display
  // This must happen before any async operations
  loadFromLocalStorage();
  
  // Then check if user is logged in and update from Firebase
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in, load their profile data
      loadUserProfileData(user);
    } else {
      // No user is signed in
      console.log('No user is signed in');
      
      // Hide user dropdown if it exists
      const userDropdown = document.getElementById('userDropdown');
      if (userDropdown) {
        userDropdown.style.display = 'none';
      }
      
      // Show logged out buttons if they exist
      const loggedOutButtons = document.getElementById('loggedOutButtons');
      if (loggedOutButtons) {
        loggedOutButtons.style.display = 'flex';
      }
    }
  });
  
  // Load user data from localStorage for instant display
  function loadFromLocalStorage() {
    try {
      const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
      
      if (userData && (userData.fullName || userData.displayName)) {
        // We have user data in localStorage, update UI immediately
        console.log('Loading user data from localStorage for instant display');
        
        // Create a complete user data object from localStorage
        const displayData = {
          uid: userData.uid || 'local-user',
          fullName: userData.fullName || userData.displayName || 'User',
          email: userData.email || '',
          photoURL: getCorrectImagePath(userData.photoURL) || getDefaultProfilePic()
        };
        
        // Update UI immediately
        updateUIWithUserData(displayData, displayData.uid);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }
  
  // Get the correct path for the default profile picture based on current page location
  function getDefaultProfilePic() {
    // Check if we're in a subdirectory by looking at the URL
    const isInSubdirectory = window.location.pathname.includes('/pages/') || 
                             window.location.pathname.includes('/auth/');
    
    // Return the appropriate path
    return isInSubdirectory ? '../assets/images/user.png' : 'assets/images/user.png';
  }
  
  // Adjust image path based on current page location
  function getCorrectImagePath(path) {
    if (!path) return null;
    
    // If it's already a full URL (http/https), return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's a relative path, make sure it's correct for the current page
    if (path.includes('assets/images/user.png')) {
      return getDefaultProfilePic();
    }
    
    return path;
  }
  
  // Load user profile data from Firebase Realtime Database
  function loadUserProfileData(user) {
    const uid = user.uid;
    const userRef = firebase.database().ref('users/' + uid);
    
    userRef.once('value').then(function(snapshot) {
      const userData = snapshot.val() || {};
      
      // Create a complete user data object combining auth and database data
      const completeUserData = {
        uid: uid,
        fullName: userData.fullName || user.displayName || 'User',
        email: user.email || userData.email || '',
        photoURL: userData.photoURL || user.photoURL || getDefaultProfilePic(),
        mobile: userData.mobile || '',
        // Add any other user properties here
      };
      
      // Save to localStorage for access across the site
      localStorage.setItem('milkMate_userData', JSON.stringify(completeUserData));
      
      // If this is a new user (no data in database), create their profile
      if (!snapshot.exists()) {
        console.log('Creating new user profile in database');
        userRef.set({
          fullName: user.displayName || 'User',
          email: user.email,
          photoURL: user.photoURL || getDefaultProfilePic(),
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
      }
      
      updateUIWithUserData(completeUserData, uid);
    }).catch(function(error) {
      console.error('Error fetching user data:', error);
      
      // Fallback to auth data if database fetch fails
      const fallbackData = {
        uid: uid,
        fullName: user.displayName || 'User',
        email: user.email || '',
        photoURL: user.photoURL || getDefaultProfilePic()
      };
      
      // Save fallback data to localStorage
      localStorage.setItem('milkMate_userData', JSON.stringify(fallbackData));
      
      updateUIWithUserData(fallbackData, uid);
    });
  }
  
  // Update UI elements with user data
  function updateUIWithUserData(userData, uid) {
    // Get default profile picture URL
    const profilePicUrl = userData.photoURL || getDefaultProfilePic();
    
    // CRITICAL: Update user name elements FIRST for fastest visual response
    updateElementsWithSelector('.user-name', userData.fullName || 'User');
    updateElementsWithSelector('#userName', userData.fullName || 'User');
    updateElementsWithSelector('#userNameGreeting', userData.fullName || 'User');
    updateElementsWithSelector('#sidebarUserName', userData.fullName || 'User');
    updateElementsWithSelector('#dropdownUserName', userData.fullName || 'User');
    
    // Update user email elements
    updateElementsWithSelector('.user-email', userData.email || '');
    updateElementsWithSelector('#userEmail', userData.email || '');
    updateElementsWithSelector('#sidebarUserEmail', userData.email || '');
    updateElementsWithSelector('#dropdownUserEmail', userData.email || '');
    
    // Update profile picture elements
    updateImageElementsWithSelector('.user-avatar', profilePicUrl);
    updateImageElementsWithSelector('#userProfilePic', profilePicUrl);
    updateImageElementsWithSelector('#sidebarUserAvatar', profilePicUrl);
    updateImageElementsWithSelector('#dropdownUserAvatar', profilePicUrl);
    updateImageElementsWithSelector('#mobileNavAvatar', profilePicUrl);
    
    // Show user dropdown if it exists
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
      userDropdown.style.display = 'flex';
    }
    
    // Hide logged out buttons if they exist
    const loggedOutButtons = document.getElementById('loggedOutButtons');
    if (loggedOutButtons) {
      loggedOutButtons.style.display = 'none';
    }
    
    console.log('User profile data loaded successfully');
  }
  
  // Helper function to update text content of elements
  function updateElementsWithSelector(selector, value) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(function(element) {
      if (element) {
        element.textContent = value;
      }
    });
  }
  
  // Helper function to update src attribute of image elements
  function updateImageElementsWithSelector(selector, value) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(function(element) {
      if (element) {
        element.src = value;
      }
    });
  }
  
  // Handle logout button click
  const logoutButtons = document.querySelectorAll('#logoutButton, #logoutBtn');
  logoutButtons.forEach(function(button) {
    if (button) {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        firebase.auth().signOut().then(function() {
          // Clear user data from localStorage
          localStorage.removeItem('milkMate_userData');
          // Sign-out successful, redirect to home page
          window.location.href = '/index.html';
        }).catch(function(error) {
          console.error('Error signing out:', error);
        });
      });
    }
  });
}); 