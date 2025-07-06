/**
 * Profile Page Script
 * Handles user profile data and UI interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded!');
        return;
    }
    
    // Check if user is logged in
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in, load their profile data
            loadUserProfileData(user);
        } else {
            // No user is signed in, redirect to login
            window.location.href = '../auth/login.html';
        }
    });
    
    // Load user profile data
    function loadUserProfileData(user) {
        const uid = user.uid;
        const userRef = firebase.database().ref('users/' + uid);
        
        userRef.once('value').then(function(snapshot) {
            const userData = snapshot.val() || {};
            
            // Create complete user data object
            const completeUserData = {
                uid: uid,
                fullName: userData.fullName || user.displayName || 'User',
                email: user.email || userData.email || '',
                photoURL: userData.photoURL || user.photoURL || '../assets/images/user.png',
                mobile: userData.mobile || '',
                address: userData.address || '',
                bio: userData.bio || '',
                createdAt: userData.createdAt || firebase.database.ServerValue.TIMESTAMP
            };
            
            // Save to localStorage
            localStorage.setItem('milkMate_userData', JSON.stringify(completeUserData));
            
            // Update profile UI
            updateProfileUI(completeUserData);
            
            // If this is a new user, create their profile
            if (!snapshot.exists()) {
                console.log('Creating new user profile in database');
                userRef.set({
                    fullName: user.displayName || 'User',
                    email: user.email,
                    photoURL: user.photoURL || '../assets/images/user.png',
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
            }
        }).catch(function(error) {
            console.error('Error loading user profile:', error);
            
            // Fallback to auth data
            const fallbackData = {
                uid: uid,
                fullName: user.displayName || 'User',
                email: user.email || '',
                photoURL: user.photoURL || '../assets/images/user.png'
            };
            
            localStorage.setItem('milkMate_userData', JSON.stringify(fallbackData));
            updateProfileUI(fallbackData);
        });
    }
    
    // Update profile UI with user data
    function updateProfileUI(userData) {
        // Update profile info elements
        const profileUserName = document.getElementById('profileUserName');
        const profileUserEmail = document.getElementById('profileUserEmail');
        const profileAvatar = document.getElementById('profileAvatar');
        
        if (profileUserName) {
            profileUserName.textContent = userData.fullName || userData.displayName || 'User';
        }
        
        if (profileUserEmail) {
            profileUserEmail.textContent = userData.email || '';
        }
        
        if (profileAvatar) {
            profileAvatar.src = userData.photoURL || '../assets/images/user.png';
            console.log('Setting profile avatar to:', userData.photoURL);
        }
        
        // Update sidebar and dropdown user info
        updateAllUserInfo(userData);
        
        // Update any form fields if present
        const fullNameInput = document.getElementById('fullName');
        const mobileInput = document.getElementById('mobileNumber');
        const addressInput = document.getElementById('address');
        const bioInput = document.getElementById('bio');
        
        if (fullNameInput) fullNameInput.value = userData.fullName || '';
        if (mobileInput) mobileInput.value = userData.mobile || '';
        if (addressInput) addressInput.value = userData.address || '';
        if (bioInput) bioInput.value = userData.bio || '';
        
        // Update profile stats if present
        updateProfileStats(userData.uid);
    }
    
    // Update all user information across the site
    function updateAllUserInfo(userData) {
        // Default profile picture
        const defaultPic = '../assets/images/user.png';
        
        // Update sidebar user info
        updateElementText('#sidebarUserName', userData.fullName || userData.displayName || 'User');
        updateElementText('#sidebarUserEmail', userData.email || '');
        updateElementSrc('#sidebarUserAvatar', userData.photoURL || defaultPic);
        
        // Update dropdown user info
        updateElementText('#dropdownUserName', userData.fullName || userData.displayName || 'User');
        updateElementText('#dropdownUserEmail', userData.email || '');
        updateElementSrc('#dropdownUserAvatar', userData.photoURL || defaultPic);
        
        // Update mobile nav user info
        updateElementSrc('#mobileNavAvatar', userData.photoURL || defaultPic);
        
        console.log('Updated all user info elements');
    }
    
    // Helper function to update text content
    function updateElementText(selector, value) {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
    }
    
    // Helper function to update image src
    function updateElementSrc(selector, value) {
        const element = document.querySelector(selector);
        if (element) element.src = value;
    }
    
    // Update profile statistics
    function updateProfileStats(uid) {
        // Get references to stats elements
        const totalRecordsEl = document.getElementById('totalRecords');
        const totalSourcesEl = document.getElementById('totalSources');
        const totalSpentEl = document.getElementById('totalSpent');
        
        if (!totalRecordsEl && !totalSourcesEl && !totalSpentEl) {
            return; // Stats elements not found
        }
        
        // Get milk records from database
        firebase.database().ref('milkRecords/' + uid).once('value').then(function(snapshot) {
            const records = snapshot.val() || {};
            const recordsArray = Object.values(records);
            
            // Calculate stats
            const totalRecords = recordsArray.length;
            const sources = [...new Set(recordsArray.map(record => record.source))];
            const totalSources = sources.length;
            const totalSpent = recordsArray.reduce((sum, record) => sum + (record.price || 0), 0);
            
            // Update UI
            if (totalRecordsEl) totalRecordsEl.textContent = totalRecords;
            if (totalSourcesEl) totalSourcesEl.textContent = totalSources;
            if (totalSpentEl) totalSpentEl.textContent = '₹' + totalSpent.toFixed(2);
        }).catch(function(error) {
            console.error('Error loading profile stats:', error);
            
            // Set default values
            if (totalRecordsEl) totalRecordsEl.textContent = '0';
            if (totalSourcesEl) totalSourcesEl.textContent = '0';
            if (totalSpentEl) totalSpentEl.textContent = '₹0.00';
        });
    }
    
    // Handle profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = firebase.auth().currentUser;
            if (!user) return;
            
            const fullName = document.getElementById('fullName').value;
            const mobile = document.getElementById('mobileNumber').value;
            const address = document.getElementById('address')?.value || '';
            const bio = document.getElementById('bio')?.value || '';
            
            // Update user profile in database
            firebase.database().ref('users/' + user.uid).update({
                fullName: fullName,
                mobile: mobile,
                address: address,
                bio: bio,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            }).then(function() {
                console.log('Profile updated successfully');
                
                // Update display name in Firebase Auth
                user.updateProfile({
                    displayName: fullName
                }).then(function() {
                    console.log('Auth display name updated');
                }).catch(function(error) {
                    console.error('Error updating auth display name:', error);
                });
                
                // Update localStorage
                const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
                userData.fullName = fullName;
                userData.mobile = mobile;
                userData.address = address;
                userData.bio = bio;
                localStorage.setItem('milkMate_userData', JSON.stringify(userData));
                
                // Update UI
                updateAllUserInfo(userData);
                
                // Show success message
                showToast('Profile updated successfully', 'success');
            }).catch(function(error) {
                console.error('Error updating profile:', error);
                showToast('Error updating profile', 'error');
            });
        });
    }
    
    // Handle profile picture upload
    const profilePictureInput = document.getElementById('profilePictureInput');
    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                
                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('Image size should be less than 5MB', 'error');
                    return;
                }
                
                // Upload image
                uploadProfilePicture(file);
            }
        });
    }
    
    // Upload profile picture
    function uploadProfilePicture(file) {
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        // Show loading state
        const profilePicOverlay = document.getElementById('profilePictureOverlay');
        if (profilePicOverlay) {
            profilePicOverlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            profilePicOverlay.classList.add('uploading');
        }
        
        // Create a storage reference
        const storageRef = firebase.storage().ref();
        const profilePicRef = storageRef.child('profile_pictures/' + user.uid + '/' + Date.now() + '.jpg');
        
        // Upload file
        profilePicRef.put(file).then(function(snapshot) {
            // Get download URL
            return snapshot.ref.getDownloadURL();
        }).then(function(downloadURL) {
            console.log('File available at', downloadURL);
            
            // Update user profile in database
            return firebase.database().ref('users/' + user.uid).update({
                photoURL: downloadURL,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        }).then(function() {
            // Update auth profile
            return user.updateProfile({
                photoURL: downloadURL
            });
        }).then(function() {
            console.log('Profile picture updated successfully');
            
            // Update localStorage
            const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
            userData.photoURL = downloadURL;
            localStorage.setItem('milkMate_userData', JSON.stringify(userData));
            
            // Update UI
            updateElementSrc('#profileAvatar', downloadURL);
            updateElementSrc('#sidebarUserAvatar', downloadURL);
            updateElementSrc('#dropdownUserAvatar', downloadURL);
            updateElementSrc('#mobileNavAvatar', downloadURL);
            
            // Reset loading state
            if (profilePicOverlay) {
                profilePicOverlay.innerHTML = '<i class="fas fa-camera"></i>';
                profilePicOverlay.classList.remove('uploading');
            }
            
            // Show success message
            showToast('Profile picture updated successfully', 'success');
        }).catch(function(error) {
            console.error('Error uploading profile picture:', error);
            
            // Reset loading state
            if (profilePicOverlay) {
                profilePicOverlay.innerHTML = '<i class="fas fa-camera"></i>';
                profilePicOverlay.classList.remove('uploading');
            }
            
            // Show error message
            showToast('Error uploading profile picture', 'error');
        });
    }
    
    // Show toast message
    function showToast(message, type = 'info') {
        // Check if toast container exists, create if not
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <i class="fas fa-times toast-close"></i>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
        
        // Close on click
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
}); 