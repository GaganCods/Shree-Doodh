// ✅ Updated Firebase Auth Page Handler with Proper Error Display & UX

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const errorMessage = document.getElementById("errorMessage");
  
    // Debug signup form
    if (signupForm) {
      console.log("DOMContentLoaded: Signup form found in auth.js");
      
      // Add direct click handler to create account button
      const createAccountBtn = document.getElementById("createAccountBtn");
      if (createAccountBtn) {
        console.log("DOMContentLoaded: Create account button found in auth.js");
        createAccountBtn.addEventListener("click", function(e) {
          console.log("Create account button clicked in auth.js");
        });
      }
    }
  
    // 🔄 Utility Functions
    function showLoading() {
      if (loadingSpinner) loadingSpinner.style.display = "flex";
    }
  
    function hideLoading() {
      if (loadingSpinner) loadingSpinner.style.display = "none";
    }

    function showError(error) {
        let message = "Something went wrong. Please try again.";
      
        // Firebase error format (string)
        if (typeof error === "string") {
          try {
            const parsed = JSON.parse(error);
            if (parsed.error && parsed.error.message) {
              message = parsed.error.message;
            } else {
              message = error;
            }
          } catch {
            message = error;
          }
        }
      
        // Firebase error format (object)
        else if (typeof error === "object" && error.code) {
          switch (error.code) {
            case "auth/user-not-found":
            case "auth/invalid-login-credentials":
            case "auth/invalid-credential":
              message = "Incorrect email or password.";
              break;
            case "auth/wrong-password":
              message = "Incorrect password.";
              break;
            case "auth/invalid-email":
              message = "Invalid email address.";
              break;
            case "auth/email-already-in-use":
              message = "This email is already in use.";
              break;
            case "auth/weak-password":
              message = "Password is too weak. Use at least 6 characters.";
              break;
            case "auth/too-many-requests":
              message = "Too many attempts. Please try again later.";
              break;
            case "auth/network-request-failed":
              message = "Network error. Check your internet connection.";
              break;
            default:
              message = error.message || message;
          }
        }
      
        // Sanitize "Firebase: ..." format
        if (message.startsWith("Firebase:")) {
          message = message.replace(/^Firebase:\s*/, "").split("(")[0].trim();
        }
      
        // UI output
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
  
    // 🌐 Store user in Realtime DB
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
        throw error; // Re-throw the error to be handled by the caller
      }
    }
    
    // Update user's last login timestamp
    async function updateLastLogin(uid) {
      return firebase.database().ref("users/" + uid + "/lastLogin").set(new Date().toISOString());
    }
  
    // 🔁 Auth State Persistence
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // Update last login time in database
        updateLastLogin(user.uid).catch(err => console.error("Error updating last login:", err));
        
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
      }
    });
  
    // 🔄 Form Tabs
    function switchForm(type) {
      [loginTab, signupTab].forEach(t => t.classList.remove("active"));
      [loginForm, signupForm].forEach(f => f.classList.remove("active", "sliding-left", "sliding-right"));
  
      if (type === "login") {
        loginTab.classList.add("active");
        signupForm.classList.add("sliding-right");
        loginForm.classList.add("active");
      } else {
        signupTab.classList.add("active");
        loginForm.classList.add("sliding-left");
        signupForm.classList.add("active");
      }
      hideError();
    }
  
    loginTab?.addEventListener("click", () => switchForm("login"));
    signupTab?.addEventListener("click", () => switchForm("signup"));
  
    // 🔐 Login
    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError();
      showLoading();
  
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
  
      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        // Update last login in database
        await updateLastLogin(userCredential.user.uid);
        
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
        showError(err);
      }
    });
  
    // 📝 Signup
    signupForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Signup form submitted in auth.js");
      hideError();
      showLoading();
  
      const fullName = document.getElementById("fullName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const termsAgree = document.getElementById("termsAgree").checked;
      
      console.log("Form values collected:", { fullName, email, hasPassword: !!password, hasConfirmPassword: !!confirmPassword, termsAgree });
  
      if (!fullName || !email || !password || !confirmPassword) {
        hideLoading();
        console.log("Missing required fields");
        return showError("Please fill in all fields.");
      }
      if (!termsAgree) {
        hideLoading();
        console.log("Terms not agreed to");
        return showError("Please agree to the Terms & Privacy Policy.");
      }
      if (!isValidEmail(email)) {
        hideLoading();
        console.log("Invalid email format");
        return showError("Enter a valid email address.");
      }
      if (password !== confirmPassword) {
        hideLoading();
        console.log("Passwords don't match");
        return showError("Passwords do not match.");
      }
      if (password.length < 6) {
        hideLoading();
        console.log("Password too short");
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
        showError(err);
      }
    });
  
    // 🔒 Google Auth
    document.querySelectorAll(".btn-google").forEach(btn => {
      btn.addEventListener("click", async () => {
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
          } else {
            // Update last login time
            await updateLastLogin(result.user.uid);
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
          showError(err);
        }
      });
    });
  
    // 👁️ Toggle password visibility
    document.querySelectorAll(".toggle-password").forEach(btn => {
      btn.addEventListener("click", function () {
        const input = this.parentElement.querySelector("input");
        input.type = input.type === "password" ? "text" : "password";
        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
      });
    });
  
    // 🧭 Signup Step Navigation
    let currentStep = 1;
    const totalSteps = 2;
  
    window.nextStep = function () {
      const fullName = document.getElementById("fullName").value;
      const email = document.getElementById("signupEmail").value;
  
      if (!fullName || !email || !isValidEmail(email)) {
        showError("Please fill in all fields with a valid email.");
        return;
      }
  
      hideError();
      currentStep++;
      updateStepIndicator();
    };
  
    window.prevStep = function () {
      currentStep--;
      updateStepIndicator();
      hideError();
    };
  
    function updateStepIndicator() {
      document.querySelectorAll(".step-indicator .step").forEach((step, index) => {
        if (index + 1 < currentStep) {
          step.classList.add("completed");
          step.classList.remove("active");
        } else if (index + 1 === currentStep) {
          step.classList.add("active");
          step.classList.remove("completed");
        } else {
          step.classList.remove("active", "completed");
        }
      });
  
      document.querySelectorAll(".form-step").forEach((step, index) => {
        if (index + 1 === currentStep) {
          step.style.display = "block";
          step.classList.add("active");
        } else {
          step.style.display = "none";
          step.classList.remove("active");
        }
      });
      
      // For progress bar if it exists
      const progressBar = document.querySelector(".progress-bar");
      if (progressBar) {
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progress}%`;
      }
    }
  });
  