// Settings Page JavaScript

// ImgBB API Key - Replace with your actual API key
const IMGBB_API_KEY = "d918b7ebd10cca3613870e621063f892"; // Replace with your actual API key

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    console.log("Settings page loaded");
    
    // Check if user is logged in
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            console.log("User authenticated:", user.email);
            initializeSettingsPage(user);
        } else {
            // No user is signed in, redirect to login
            console.log("No user authenticated, redirecting to login");
            window.location.href = '../auth/login.html';
        }
    });

    // Add direct event listeners for modal buttons as a fallback
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const logoutAllBtn = document.getElementById('logoutAllBtn');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    const logoutModal = document.getElementById('logoutModal');

    if (deleteAccountBtn && deleteAccountModal) {
        console.log("Adding direct event listener to delete account button");
        deleteAccountBtn.addEventListener('click', function() {
            console.log("Delete account button clicked directly");
            deleteAccountModal.style.display = 'flex';
        });
    }

    if (logoutAllBtn && logoutModal) {
        console.log("Adding direct event listener to logout button");
        logoutAllBtn.addEventListener('click', function() {
            console.log("Logout button clicked directly");
            logoutModal.style.display = 'flex';
        });
    }
});

// Initialize Settings Page
function initializeSettingsPage(user) {
    console.log("Initializing settings page for user:", user.uid);
    
    // Load user data
    loadUserData(user);
    
    // Initialize tabs
    initTabs();
    
    // Initialize profile settings
    initProfileSettings(user);
    
    // Initialize password reset
    initPasswordReset(user);
    
    // Initialize preferences settings
    initPreferencesSettings(user);
    
    // Initialize danger zone
    initDangerZone(user);
    
    // Initialize modal close on outside click
    initModalCloseOnOutsideClick();
    
    // Load the most up-to-date profile picture from Firebase
    if (typeof loadUserProfilePic === 'function') {
        loadUserProfilePic();
    }
}

// Load User Data
function loadUserData(user) {
    // Set email in read-only field
    document.getElementById('email').value = user.email;
    
    // Set email in reset password section
    document.getElementById('resetEmailDisplay').textContent = user.email;
    
    // Load user profile data from Firebase
    firebase.database().ref('users/' + user.uid).once('value').then(function(snapshot) {
        const userData = snapshot.val() || {};
        
        // Set form values
        document.getElementById('fullName').value = userData.fullName || user.displayName || '';
        document.getElementById('mobileNumber').value = userData.mobile || '';
        
        // Set profile picture if available
        const profilePicUrl = userData.photoURL || user.photoURL || '../assets/images/user.png';
        document.getElementById('profileImage').src = profilePicUrl;
        
        // Update all profile pictures
        updateAllProfilePictures(profilePicUrl);
        
        // Set user name in sidebar
        const displayName = userData.fullName || user.displayName || 'User';
        document.getElementById('sidebarUserName').textContent = displayName;
        document.getElementById('dropdownUserName').textContent = displayName;
        
        // Set user email in sidebar
        document.getElementById('sidebarUserEmail').textContent = user.email;
        document.getElementById('dropdownUserEmail').textContent = user.email;
        
        // Load preferences
        if (userData.preferences) {
            document.getElementById('notificationsPreference').checked = userData.preferences.notifications !== false;
            document.getElementById('darkModePreference').checked = userData.preferences.darkMode === true;
            
            if (userData.preferences.startDay) {
                document.getElementById('calendarStartDay').value = userData.preferences.startDay;
            }
            
            if (userData.preferences.defaultPage) {
                document.getElementById('defaultStartPage').value = userData.preferences.defaultPage;
            }
        }
    }).catch(function(error) {
        showToast('Error', 'Failed to load user data: ' + error.message, 'error');
    });
}

// Helper function to update all profile pictures
function updateAllProfilePictures(url) {
    const profilePicElements = [
        document.getElementById('profileImage'),
        document.getElementById('sidebarUserAvatar'),
        document.getElementById('dropdownUserAvatar'),
        document.getElementById('mobileNavAvatar')
    ];
    
    profilePicElements.forEach(element => {
        if (element) {
            element.src = url;
        }
    });
}

// Initialize Tabs
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const settingsSections = document.querySelectorAll('.settings-section');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Remove active class from all tabs and sections
            tabBtns.forEach(btn => btn.classList.remove('active'));
            settingsSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding section
            this.classList.add('active');
            document.getElementById(tabId + 'Section').classList.add('active');
        });
    });
}

// Initialize Profile Settings
function initProfileSettings(user) {
    console.log("Initializing profile settings");
    
    const profileForm = document.querySelector('.profile-form');
    const fullNameInput = document.getElementById('fullName');
    const mobileNumberInput = document.getElementById('mobileNumber');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    const profilePictureOverlay = document.getElementById('profilePictureOverlay');
    const profilePictureInput = document.getElementById('profilePictureInput');
    const profileImage = document.getElementById('profileImage');
    
    // Original values for cancel button
    let originalName = '';
    let originalMobile = '';
    
    // Load original values
    firebase.database().ref('users/' + user.uid).once('value').then(function(snapshot) {
        const userData = snapshot.val() || {};
        originalName = userData.fullName || user.displayName || '';
        originalMobile = userData.mobile || '';
        
        // Set initial values
        fullNameInput.value = originalName;
        mobileNumberInput.value = originalMobile;
        
        // Set profile picture if available
        const profilePicUrl = userData.photoURL || user.photoURL || '../assets/images/user.png';
        profileImage.src = profilePicUrl;
        
        // Update all profile pictures
        updateAllProfilePictures(profilePicUrl);
    }).catch(function(error) {
        console.error("Error loading user data:", error);
        showToast('Error', 'Failed to load user data: ' + error.message, 'error');
    });
    
    // Enable save button when form data changes
    [fullNameInput, mobileNumberInput].forEach(input => {
        input.addEventListener('input', function() {
            const nameChanged = fullNameInput.value !== originalName;
            const mobileChanged = mobileNumberInput.value !== originalMobile;
            
            saveProfileBtn.disabled = !(nameChanged || mobileChanged);
        });
    });
    
    // Cancel button resets form
    cancelProfileBtn.addEventListener('click', function() {
        fullNameInput.value = originalName;
        mobileNumberInput.value = originalMobile;
        saveProfileBtn.disabled = true;
    });
    
    // Save profile changes
    saveProfileBtn.addEventListener('click', function() {
        // Disable button during operation
        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        const updates = {
            fullName: fullNameInput.value.trim(),
            mobile: mobileNumberInput.value.trim()
        };
        
        firebase.database().ref('users/' + user.uid).update(updates)
            .then(function() {
                showToast('Success', 'Profile updated successfully', 'success');
                originalName = updates.fullName;
                originalMobile = updates.mobile;
                saveProfileBtn.disabled = true;
                saveProfileBtn.innerHTML = 'Save Changes';
                
                // Update user name in sidebar
                document.getElementById('sidebarUserName').textContent = updates.fullName;
                document.getElementById('dropdownUserName').textContent = updates.fullName;
                
                // Update display name in Firebase Auth
                user.updateProfile({
                    displayName: updates.fullName
                }).catch(function(error) {
                    console.error("Error updating display name:", error);
                });
            })
            .catch(function(error) {
                console.error("Error updating profile:", error);
                showToast('Error', 'Failed to update profile: ' + error.message, 'error');
                saveProfileBtn.disabled = false;
                saveProfileBtn.innerHTML = 'Save Changes';
            });
    });
    
    // Profile picture change
    if (profilePictureOverlay) {
        profilePictureOverlay.addEventListener('click', function() {
            console.log("Profile picture overlay clicked");
            if (profilePictureInput) {
                profilePictureInput.click();
            } else {
                console.error("Profile picture input not found");
            }
        });
    } else {
        console.error("Profile picture overlay not found");
    }
    
    // Handle profile picture selection
    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', function(e) {
            console.log("Profile picture input changed");
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                
                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('Error', 'Image size should be less than 5MB', 'error');
                    return;
                }
                
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    // Show cropper modal
                    const cropperModal = document.getElementById('cropperModal');
                    const cropperImage = document.getElementById('cropperImage');
                    
                    if (cropperImage && cropperModal) {
                        cropperImage.src = e.target.result;
                        cropperModal.style.display = 'flex';
                        
                        // Initialize cropper
                        if (window.imageCropper) {
                            window.imageCropper.destroy();
                        }
                        
                        // Wait for image to load before initializing cropper
                        cropperImage.onload = function() {
                            console.log("Initializing Cropper.js");
                            window.imageCropper = new Cropper(cropperImage, {
                                aspectRatio: 1,
                                viewMode: 1,
                                dragMode: 'move',
                                autoCropArea: 0.8,
                                restore: false,
                                guides: true,
                                center: true,
                                highlight: false,
                                cropBoxMovable: true,
                                cropBoxResizable: true,
                                toggleDragModeOnDblclick: false
                            });
                        };
                    } else {
                        console.error("Cropper elements not found");
                        showToast('Error', 'Could not initialize image cropper', 'error');
                    }
                };
                
                reader.readAsDataURL(file);
            }
        });
    } else {
        console.error("Profile picture input not found");
    }
    
    // Initialize cropper modal buttons
    const cancelCropBtn = document.getElementById('cancelCropBtn');
    const cropImageBtn = document.getElementById('cropImageBtn');
    const cropperModal = document.getElementById('cropperModal');
    
    if (cancelCropBtn) {
        cancelCropBtn.addEventListener('click', function() {
            if (cropperModal) {
                cropperModal.style.display = 'none';
            }
            
            if (profilePictureInput) {
                profilePictureInput.value = '';
            }
            
            if (window.imageCropper) {
                window.imageCropper.destroy();
                window.imageCropper = null;
            }
        });
    }
    
    if (cropImageBtn) {
        cropImageBtn.addEventListener('click', function() {
            if (window.imageCropper) {
                // Get cropped canvas
                const canvas = window.imageCropper.getCroppedCanvas({
                    width: 300,
                    height: 300,
                    minWidth: 150,
                    minHeight: 150,
                    maxWidth: 500,
                    maxHeight: 500,
                    fillColor: '#fff',
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });
                
                if (canvas) {
                    // Show preview modal
                    const profilePictureModal = document.getElementById('profilePictureModal');
                    const profilePreview = document.getElementById('profilePreview');
                    
                    if (profilePreview && profilePictureModal) {
                        // Convert canvas to blob
                        canvas.toBlob(function(blob) {
                            window.croppedImageBlob = blob;
                            const imageUrl = URL.createObjectURL(blob);
                            profilePreview.src = imageUrl;
                            
                            // Close cropper modal and show preview modal
                            cropperModal.style.display = 'none';
                            profilePictureModal.style.display = 'flex';
                            
                            if (window.imageCropper) {
                                window.imageCropper.destroy();
                                window.imageCropper = null;
                            }
                        });
                    } else {
                        console.error("Preview elements not found");
                        showToast('Error', 'Could not preview image', 'error');
                    }
                } else {
                    console.error("Could not crop image");
                    showToast('Error', 'Could not crop image', 'error');
                }
            } else {
                console.error("Cropper not initialized");
                showToast('Error', 'Image cropper not initialized', 'error');
            }
        });
    }
    
    // Initialize preview modal buttons
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    const confirmUploadBtn = document.getElementById('confirmUploadBtn');
    const profilePictureModal = document.getElementById('profilePictureModal');
    
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', function() {
            if (profilePictureModal) {
                profilePictureModal.style.display = 'none';
            }
            
            if (profilePictureInput) {
                profilePictureInput.value = '';
            }
            
            window.croppedImageBlob = null;
        });
    }
    
    if (confirmUploadBtn) {
        confirmUploadBtn.addEventListener('click', function() {
            if (window.croppedImageBlob) {
                uploadProfilePicture(user, window.croppedImageBlob);
            } else {
                console.error("No cropped image blob found");
                showToast('Error', 'No image to upload', 'error');
            }
        });
    }
    
    // Initialize close buttons for modals
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                
                if (modal.id === 'cropperModal') {
                    if (profilePictureInput) {
                        profilePictureInput.value = '';
                    }
                    
                    if (window.imageCropper) {
                        window.imageCropper.destroy();
                        window.imageCropper = null;
                    }
                } else if (modal.id === 'profilePictureModal') {
                    document.getElementById('uploadProgress').style.display = 'none';
                    document.getElementById('progressFill').style.width = '0%';
                    document.getElementById('progressPercentage').textContent = '0%';
                    
                    if (profilePictureInput) {
                        profilePictureInput.value = '';
                    }
                    
                    window.croppedImageBlob = null;
                } else if (modal.id === 'deleteAccountModal') {
                    document.getElementById('deleteConfirmPassword').value = '';
                } else if (modal.id === 'logoutModal') {
                    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
                    confirmLogoutBtn.disabled = false;
                    confirmLogoutBtn.innerHTML = 'Logout From All Devices';
                }
            }
        });
    });
}

// Upload Profile Picture
function uploadProfilePicture(user, blob) {
    console.log("Uploading profile picture");
    
    // Show loading state
    document.getElementById('profilePictureOverlay').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    document.getElementById('profilePictureOverlay').classList.add('uploading');
    
    // Create a FormData object to send the image
    const formData = new FormData();
    formData.append('image', blob);
    formData.append('key', IMGBB_API_KEY);
    
    // Try to upload to ImgBB first
    fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Upload successful, use the URL from ImgBB
            const imageUrl = data.data.url;
            console.log("Image uploaded to ImgBB:", imageUrl);
            
            // Save URL to Firebase
            firebase.database().ref('users/' + user.uid).update({
                photoURL: imageUrl
            })
            .then(function() {
                // Update all profile pictures
                updateAllProfilePictures(imageUrl);
                
                // Update user photoURL in Firebase Auth
                user.updateProfile({
                    photoURL: imageUrl
                }).catch(function(error) {
                    console.error("Error updating auth profile picture:", error);
                });
                
                // Reset overlay
                document.getElementById('profilePictureOverlay').innerHTML = '<i class="fas fa-camera"></i>';
                document.getElementById('profilePictureOverlay').classList.remove('uploading');
                
                showToast('Success', 'Profile picture updated successfully', 'success');
            })
            .catch(function(error) {
                console.error("Error saving profile picture URL to Firebase:", error);
                showToast('Error', 'Failed to update profile picture: ' + error.message, 'error');
                document.getElementById('profilePictureOverlay').innerHTML = '<i class="fas fa-camera"></i>';
                document.getElementById('profilePictureOverlay').classList.remove('uploading');
            });
        } else {
            // ImgBB upload failed, fallback to base64 storage
            console.warn("ImgBB upload failed, falling back to base64 storage");
            fallbackToBase64Upload(user, blob);
        }
    })
    .catch(error => {
        // ImgBB upload failed, fallback to base64 storage
        console.error("Error uploading to ImgBB:", error);
        fallbackToBase64Upload(user, blob);
    });
}

// Fallback to base64 storage
function fallbackToBase64Upload(user, blob) {
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
        const base64data = reader.result;
        
        // Save directly to Firebase
        firebase.database().ref('users/' + user.uid).update({
            photoURL: base64data
        })
        .then(function() {
            // Update all profile pictures
            updateAllProfilePictures(base64data);
            
            // Update user photoURL in Firebase Auth
            user.updateProfile({
                photoURL: base64data
            }).catch(function(error) {
                console.error("Error updating auth profile picture:", error);
            });
            
            // Reset overlay
            document.getElementById('profilePictureOverlay').innerHTML = '<i class="fas fa-camera"></i>';
            document.getElementById('profilePictureOverlay').classList.remove('uploading');
            
            showToast('Success', 'Profile picture updated successfully', 'success');
        })
        .catch(function(error) {
            console.error("Error saving profile picture to Firebase:", error);
            showToast('Error', 'Failed to update profile picture: ' + error.message, 'error');
            document.getElementById('profilePictureOverlay').innerHTML = '<i class="fas fa-camera"></i>';
            document.getElementById('profilePictureOverlay').classList.remove('uploading');
        });
    };
}

// Initialize Password Reset
function initPasswordReset(user) {
    const sendResetLinkBtn = document.getElementById('sendResetLinkBtn');
    
    sendResetLinkBtn.addEventListener('click', function() {
        // Show loading state
        const btnText = sendResetLinkBtn.querySelector('.btn-text');
        const btnLoader = sendResetLinkBtn.querySelector('.btn-loader');
        
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        sendResetLinkBtn.disabled = true;
        
        // Send password reset email
        firebase.auth().sendPasswordResetEmail(user.email)
            .then(function() {
                showToast('Success', '✅ Password reset link has been sent to your email.', 'success');
            })
            .catch(function(error) {
                showToast('Error', 'Failed to send reset link: ' + error.message, 'error');
            })
            .finally(function() {
                // Restore button state
                btnText.style.display = 'inline-block';
                btnLoader.style.display = 'none';
                sendResetLinkBtn.disabled = false;
            });
    });
}

// Initialize Preferences Settings
function initPreferencesSettings(user) {
    const notificationsToggle = document.getElementById('notificationsPreference');
    const darkModeToggle = document.getElementById('darkModePreference');
    const calendarStartDay = document.getElementById('calendarStartDay');
    const defaultStartPage = document.getElementById('defaultStartPage');
    const savePreferencesBtn = document.getElementById('savePreferencesBtn');
    
    // Sync dark mode toggle with global dark mode
    darkModeToggle.checked = document.body.classList.contains('dark-mode');
    
    // Dark mode toggle changes global dark mode
    darkModeToggle.addEventListener('change', function() {
        toggleDarkMode(this.checked);
    });
    
    // Save preferences
    savePreferencesBtn.addEventListener('click', function() {
        const preferences = {
            notifications: notificationsToggle.checked,
            darkMode: darkModeToggle.checked,
            startDay: calendarStartDay.value,
            defaultPage: defaultStartPage.value
        };
        
        // Save to Firebase
        firebase.database().ref('users/' + user.uid + '/preferences').update(preferences)
            .then(function() {
                showToast('Success', 'Preferences saved successfully', 'success');
                
                // Update notifications toggle in dropdown
                document.getElementById('notificationsToggle').checked = preferences.notifications;
                
                // Save dark mode preference to localStorage
                localStorage.setItem('darkMode', preferences.darkMode ? 'enabled' : 'disabled');
            })
            .catch(function(error) {
                showToast('Error', 'Failed to save preferences: ' + error.message, 'error');
            });
    });
}

// Initialize Danger Zone
function initDangerZone(user) {
    console.log("Initializing danger zone");
    
    // Get button elements
    const logoutAllBtn = document.getElementById('logoutAllBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    // Get modal elements
    const logoutModal = document.getElementById('logoutModal');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    
    // Get other elements
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const deleteConfirmPassword = document.getElementById('deleteConfirmPassword');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    
    console.log("Logout button:", logoutAllBtn);
    console.log("Delete account button:", deleteAccountBtn);
    console.log("Logout modal:", logoutModal);
    console.log("Delete account modal:", deleteAccountModal);
    
    // Direct event handler for logout button
    if (logoutAllBtn) {
        logoutAllBtn.addEventListener('click', function(e) {
            console.log("Logout button clicked");
            e.preventDefault(); // Prevent default action
            if (logoutModal) {
                // Remove any inline styles that might interfere
                logoutModal.removeAttribute('style');
                // Then set the display style directly
                logoutModal.style.display = 'flex';
                console.log("Logout modal display style set to:", logoutModal.style.display);
            } else {
                console.error("Logout modal not found");
            }
        });
    } else {
        console.error("Logout button not found");
    }
    
    // Direct event handler for delete account button
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function(e) {
            console.log("Delete account button clicked");
            e.preventDefault(); // Prevent default action
            if (deleteAccountModal) {
                // Remove any inline styles that might interfere
                deleteAccountModal.removeAttribute('style');
                // Then set the display style directly
                deleteAccountModal.style.display = 'flex';
                console.log("Delete account modal display style set to:", deleteAccountModal.style.display);
                if (deleteConfirmPassword) {
                    deleteConfirmPassword.value = ''; // Clear previous input
                }
                if (confirmDeleteBtn) {
                    confirmDeleteBtn.disabled = false; // Reset button state
                }
            } else {
                console.error("Delete account modal not found");
            }
        });
    } else {
        console.error("Delete account button not found");
    }
    
    // Close logout modal
    if (logoutModal && logoutModal.querySelector('.close-modal')) {
        logoutModal.querySelector('.close-modal').addEventListener('click', function() {
            logoutModal.style.display = 'none';
            console.log("Logout modal closed");
        });
    }
    
    // Cancel logout button
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            if (logoutModal) {
                logoutModal.style.display = 'none';
                console.log("Logout modal canceled");
            }
        });
    }
    
    // Confirm logout button
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function() {
            // Disable button during operation
            confirmLogoutBtn.disabled = true;
            confirmLogoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
            
            firebase.auth().signOut()
                .then(function() {
                    // Redirect to login page
                    window.location.href = '../auth/login.html';
                })
                .catch(function(error) {
                    console.error("Error during logout:", error);
                    showToast('Error', 'Failed to logout: ' + error.message, 'error');
                    confirmLogoutBtn.disabled = false;
                    confirmLogoutBtn.innerHTML = 'Logout From All Devices';
                    if (logoutModal) {
                        logoutModal.style.display = 'none';
                    }
                });
        });
    }
    
    // Close delete account modal
    if (deleteAccountModal && deleteAccountModal.querySelector('.close-modal')) {
        deleteAccountModal.querySelector('.close-modal').addEventListener('click', function() {
            deleteAccountModal.style.display = 'none';
            if (deleteConfirmPassword) {
                deleteConfirmPassword.value = '';
            }
        });
    }
    
    // Cancel delete button
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            if (deleteAccountModal) {
                deleteAccountModal.style.display = 'none';
            }
            if (deleteConfirmPassword) {
                deleteConfirmPassword.value = '';
            }
        });
    }
    
    // Confirm delete button
    if (confirmDeleteBtn && deleteConfirmPassword) {
        confirmDeleteBtn.addEventListener('click', function() {
            const password = deleteConfirmPassword.value;
            
            if (!password) {
                showToast('Error', 'Please enter your password', 'error');
                return;
            }
            
            // Disable button during operation
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            
            // Re-authenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email, 
                password
            );
            
            user.reauthenticateWithCredential(credential)
                .then(function() {
                    // Delete user data from database
                    return firebase.database().ref('users/' + user.uid).remove();
                })
                .then(function() {
                    // Delete user account
                    return user.delete();
                })
                .then(function() {
                    // Redirect to login page
                    window.location.href = '../auth/login.html';
                })
                .catch(function(error) {
                    console.error("Error during account deletion:", error);
                    if (error.code === 'auth/wrong-password') {
                        showToast('Error', 'Password is incorrect', 'error');
                    } else {
                        showToast('Error', 'Failed to delete account: ' + error.message, 'error');
                    }
                    confirmDeleteBtn.disabled = false;
                    confirmDeleteBtn.innerHTML = 'Delete My Account';
                });
        });
    }
}

// Initialize modal close on outside click
function initModalCloseOnOutsideClick() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                // Remove any inline styles that might interfere
                modal.removeAttribute('style');
                // Then set the display style
                modal.style.display = 'none';
                
                // Reset specific modal states
                if (modal.id === 'cropperModal') {
                    document.getElementById('profilePictureInput').value = '';
                    if (window.imageCropper) {
                        window.imageCropper.destroy();
                        window.imageCropper = null;
                    }
                } else if (modal.id === 'profilePictureModal') {
                    document.getElementById('uploadProgress').style.display = 'none';
                    document.getElementById('progressFill').style.width = '0%';
                    document.getElementById('progressPercentage').textContent = '0%';
                    document.getElementById('profilePictureInput').value = '';
                    window.croppedImageBlob = null;
                } else if (modal.id === 'deleteAccountModal') {
                    document.getElementById('deleteConfirmPassword').value = '';
                } else if (modal.id === 'logoutModal') {
                    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
                    confirmLogoutBtn.disabled = false;
                    confirmLogoutBtn.innerHTML = 'Logout From All Devices';
                }
            }
        });
    });
}

// Show Toast Notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'warning') icon = 'exclamation-circle';
    
    // Toast content
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Close button functionality
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
} 