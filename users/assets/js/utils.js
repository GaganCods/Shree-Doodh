// Global utility functions

// Global function for logging out
function logoutUser() {
    console.log('Logout function called');
    
    try {
        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error('Firebase not initialized');
            alert('Error: Firebase not initialized');
            return;
        }
        
        // Perform logout
        firebase.auth().signOut()
            .then(function() {
                console.log('Logout successful');
                // Clear user data
                localStorage.removeItem('milkMate_userData');
                // Redirect to login page
                window.location.href = '../auth/login.html';
            })
            .catch(function(error) {
                console.error('Logout error:', error);
                alert('Logout failed: ' + error.message);
            });
    } catch (e) {
        console.error('Exception during logout:', e);
        alert('An error occurred during logout');
        
        // Fallback: force redirect to login page
        setTimeout(function() {
            localStorage.removeItem('milkMate_userData');
            window.location.href = '../auth/login.html';
        }, 1000);
    }
}

// Global function for resetting password
function resetUserPassword() {
    console.log('Reset password function called');
    
    try {
        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error('Firebase not initialized');
            alert('Error: Firebase not initialized');
            return;
        }
        
        // Get current user
        const user = firebase.auth().currentUser;
        
        if (user) {
            // Send password reset email
            firebase.auth().sendPasswordResetEmail(user.email)
                .then(function() {
                    console.log('Password reset email sent');
                    alert('Password reset email sent to ' + user.email + '. Please check your inbox.');
                })
                .catch(function(error) {
                    console.error('Password reset error:', error);
                    alert('Error sending password reset email: ' + error.message);
                });
        } else {
            // Try to get email from localStorage
            const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
            
            if (userData.email) {
                firebase.auth().sendPasswordResetEmail(userData.email)
                    .then(function() {
                        console.log('Password reset email sent (from localStorage)');
                        alert('Password reset email sent to ' + userData.email + '. Please check your inbox.');
                    })
                    .catch(function(error) {
                        console.error('Password reset error:', error);
                        alert('Error sending password reset email: ' + error.message);
                    });
            } else {
                alert('You must be logged in to reset your password.');
            }
        }
    } catch (e) {
        console.error('Exception during password reset:', e);
        alert('An error occurred while trying to reset your password.');
    }
}

// Update user info from localStorage
function updateUserInfo() {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
    
    // Update profile data if on profile page
    const profileUserName = document.getElementById('profileUserName');
    const profileUserEmail = document.getElementById('profileUserEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (userData.displayName) {
        if (profileUserName) profileUserName.textContent = userData.displayName;
    }
    
    if (userData.email) {
        if (profileUserEmail) profileUserEmail.textContent = userData.email;
    }
    
    if (userData.photoURL) {
        if (profileAvatar) profileAvatar.src = userData.photoURL;
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

// Load user profile picture from Firebase and update it across the site
function loadUserProfilePic() {
    console.log('Loading user profile picture');
    
    try {
        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error('Firebase not initialized for profile pic loading');
            return;
        }
        
        // Get current user
        const user = firebase.auth().currentUser;
        
        if (user) {
            // Load user profile data from Firebase
            firebase.database().ref('users/' + user.uid).once('value').then(function(snapshot) {
                const userData = snapshot.val() || {};
                
                // Get profile picture URL
                let profilePicUrl = userData.profilePic || user.photoURL || getDefaultProfilePic();
                
                // Update localStorage with the profile pic URL
                const localUserData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
                localUserData.photoURL = profilePicUrl;
                localStorage.setItem('milkMate_userData', JSON.stringify(localUserData));
                
                // Update all profile pictures across the site
                updateAllProfilePictures(profilePicUrl);
                
                console.log('Profile picture updated successfully');
            }).catch(function(error) {
                console.error('Error loading profile picture:', error);
            });
        } else {
            // Try to get from localStorage as fallback
            const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
            if (userData.photoURL) {
                updateAllProfilePictures(userData.photoURL);
            }
        }
    } catch (e) {
        console.error('Exception during profile picture loading:', e);
    }
}

// Helper function to update all profile pictures across the site
function updateAllProfilePictures(imageUrl) {
    if (!imageUrl) return;
    
    // List of all profile picture elements across the site
    const profilePicElements = [
        // Sidebar
        document.getElementById('sidebarUserAvatar'),
        // Dropdown
        document.getElementById('dropdownUserAvatar'),
        // Mobile navigation
        document.getElementById('mobileNavAvatar'),
        // Profile page
        document.getElementById('profileImage'),
        document.getElementById('profileAvatar'),
        // Main index page user dropdown
        document.getElementById('userProfilePic')
    ];
    
    // Update all profile picture elements that exist
    profilePicElements.forEach(element => {
        if (element) {
            element.src = imageUrl;
        }
    });
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load user profile picture after a short delay to ensure Firebase is initialized
    setTimeout(loadUserProfilePic, 500);
}); 