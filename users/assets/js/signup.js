/**
 * Signup Page JavaScript
 * This file contains all the functionality needed for the signup page.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Signup page loaded");
    
    // Get form elements
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('termsAgree');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    
    // Utility functions
    function showLoading() {
        if (loadingSpinner) loadingSpinner.style.display = "flex";
    }
    
    function hideLoading() {
        if (loadingSpinner) loadingSpinner.style.display = "none";
    }
    
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = "block";
        }
        console.error("Error shown:", message);
    }
    
    function hideError() {
        if (errorMessage) errorMessage.style.display = "none";
    }
    
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // Store user data in Firebase
    async function storeUserData(uid, name, email, photoURL = null) {
        console.log("Storing user data for:", { uid, name, email, photoURL });
        
        const userData = {
            fullName: name,
            email: email,
            photoURL: photoURL,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        try {
            await firebase.database().ref("users/" + uid).set(userData);
            console.log("User data stored successfully");
            return true;
        } catch (error) {
            console.error("Error storing user data:", error);
            throw error;
        }
    }
    
    // Step navigation functions
    window.nextStep = function() {
        console.log("nextStep function called");
        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        
        // Basic validation
        if (!fullName) {
            showError("Please enter your full name");
            return;
        }
        
        if (!email || !isValidEmail(email)) {
            showError("Please enter a valid email address");
            return;
        }
        
        hideError();
        
        // Hide step 1, show step 2
        document.getElementById("step1").classList.remove("active");
        document.getElementById("step2").classList.add("active");
        
        // Update step indicator
        document.querySelector(".step[data-step='1']").classList.remove("active");
        document.querySelector(".step[data-step='2']").classList.add("active");
        
        console.log("Step 1 -> Step 2 transition complete");
    };
    
    window.previousStep = function() {
        console.log("previousStep function called");
        
        // Hide step 2, show step 1
        document.getElementById("step2").classList.remove("active");
        document.getElementById("step1").classList.add("active");
        
        // Update step indicator
        document.querySelector(".step[data-step='2']").classList.remove("active");
        document.querySelector(".step[data-step='1']").classList.add("active");
        
        hideError();
        console.log("Step 2 -> Step 1 transition complete");
    };
    
    // Form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log("Signup form submitted");
            
            hideError();
            showLoading();
            
            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const termsAgree = termsCheckbox.checked;
            
            console.log("Form values:", { fullName, email, hasPassword: !!password, hasConfirmPassword: !!confirmPassword, termsAgree });
            
            // Validation
            if (!fullName || !email || !password || !confirmPassword) {
                hideLoading();
                return showError("Please fill in all fields.");
            }
            
            if (!termsAgree) {
                hideLoading();
                return showError("Please agree to the Terms & Privacy Policy.");
            }
            
            if (!isValidEmail(email)) {
                hideLoading();
                return showError("Enter a valid email address.");
            }
            
            if (password !== confirmPassword) {
                hideLoading();
                return showError("Passwords do not match.");
            }
            
            if (password.length < 6) {
                hideLoading();
                return showError("Password must be at least 6 characters.");
            }
            
            try {
                console.log("Creating user account...");
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                console.log("User account created, updating profile...");
                await userCredential.user.updateProfile({ displayName: fullName });
                console.log("Profile updated, storing user data...");
                await storeUserData(userCredential.user.uid, fullName, email, null);
                console.log("User data stored successfully");
                
                // Check if there's a redirect URL in sessionStorage
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    // Clear the redirect URL from sessionStorage
                    sessionStorage.removeItem('redirectAfterLogin');
                    // Redirect to the stored URL
                    console.log("Redirecting to:", redirectUrl);
                    window.location.href = redirectUrl;
                } else {
                    // Default redirect to dashboard
                    console.log("Redirecting to dashboard");
                    window.location.href = "../dashboard.html";
                }
            } catch (err) {
                console.error("Error during signup:", err);
                hideLoading();
                
                // Handle Firebase errors
                if (err.code === "auth/email-already-in-use") {
                    showError("This email is already in use.");
                } else if (err.code === "auth/invalid-email") {
                    showError("Invalid email address.");
                } else if (err.code === "auth/weak-password") {
                    showError("Password is too weak. Use at least 6 characters.");
                } else {
                    showError(err.message || "An error occurred during signup.");
                }
            }
        });
    }
    
    // Google signup
    const googleButton = document.querySelector('.btn-google');
    if (googleButton) {
        googleButton.addEventListener('click', async function() {
            hideError();
            showLoading();
            
            const provider = new firebase.auth.GoogleAuthProvider();
            
            try {
                const result = await firebase.auth().signInWithPopup(provider);
                if (result.additionalUserInfo?.isNewUser) {
                    await storeUserData(
                        result.user.uid, 
                        result.user.displayName, 
                        result.user.email,
                        result.user.photoURL
                    );
                }
                
                // Check if there's a redirect URL in sessionStorage
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    // Clear the redirect URL from sessionStorage
                    sessionStorage.removeItem('redirectAfterLogin');
                    // Redirect to the stored URL
                    window.location.href = redirectUrl;
                } else {
                    // Default redirect to dashboard
                    window.location.href = "../dashboard.html";
                }
            } catch (err) {
                hideLoading();
                showError(err.message || "Error signing in with Google");
            }
        });
    }
    
    // Password visibility toggle
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("click", function() {
            const input = this.parentElement.querySelector("input");
            input.type = input.type === "password" ? "text" : "password";
            this.classList.toggle("fa-eye");
            this.classList.toggle("fa-eye-slash");
        });
    });
}); 