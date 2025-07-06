// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("resetPasswordForm");
    const resetEmail = document.getElementById("resetEmail");
    const errorMessage = document.getElementById("errorMessage");
    const loadingSpinner = document.getElementById("loadingSpinner");
  
    // Show message function
    function showError(message, isSuccess = false) {
      errorMessage.textContent = message;
      errorMessage.style.backgroundColor = isSuccess ? "#4ade80" : "#f87171"; // green or red
      errorMessage.style.display = "block";
  
      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 4000);
    }
  
    // Handle form submit
    resetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = resetEmail.value.trim();
  
      if (!email) {
        showError("Please enter a valid email address.");
        return;
      }
  
      loadingSpinner.style.display = "flex";
  
      firebase
        .auth()
        .sendPasswordResetEmail(email)
        .then(() => {
          loadingSpinner.style.display = "none";
          showError("Password reset email sent successfully!", true);
          resetForm.reset();
        })
        .catch((error) => {
          loadingSpinner.style.display = "none";
          let message = "Something went wrong. Please try again.";
  
          switch (error.code) {
            case "auth/user-not-found":
              message = "No account found with this email.";
              break;
            case "auth/invalid-email":
              message = "The email address is not valid.";
              break;
          }
  
          showError(message);
        });
    });
  });
  
  // Reset Password
  const auth = firebase.auth();
  const params = new URLSearchParams(window.location.search);
  const oobCode = params.get("oobCode");

  const form = document.getElementById("resetForm");
  const newPasswordInput = document.getElementById("newPassword");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const errorBox = document.getElementById("errorMessage");

  function showLoading() {
    loadingSpinner.style.display = "flex";
  }

  function hideLoading() {
    loadingSpinner.style.display = "none";
  }

  function showError(message, success = false) {
    errorBox.style.display = "block";
    errorBox.style.color = success ? "green" : "red";
    errorBox.textContent = message;
  }

  function validatePassword(pw) {
    const minLength = pw.length >= 8;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    return minLength && hasUpper && hasLower && hasNumber;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideLoading();
    errorBox.style.display = "none";

    const password = newPasswordInput.value.trim();

    if (!validatePassword(password)) {
      showError("Password must be at least 8 characters long and include uppercase, lowercase, and a number.");
      return;
    }

    if (!oobCode) {
      showError("Invalid or expired reset link.");
      return;
    }

    try {
      showLoading();
      await auth.confirmPasswordReset(oobCode, password);
      showError("Password reset successful. You can now log in.", true);
      hideLoading();
    } catch (err) {
      console.error("Reset failed:", err);
      showError(err.message);
      hideLoading();
    }
  });

  // 👁️ Toggle password visibility
    document.querySelectorAll(".toggle-password").forEach(btn => {
      btn.addEventListener("click", function () {
        const input = this.parentElement.querySelector("input");
        input.type = input.type === "password" ? "text" : "password";
        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
      });


      //show error message
    });function showError(message, isSuccess = false) {
        const errorBox = document.getElementById("errorMessage");
        errorBox.classList.remove("error-message", "success-message");
        errorBox.classList.add(isSuccess ? "success-message" : "error-message");
      
        errorBox.textContent = message;
        errorBox.style.display = "block";
      
        setTimeout(() => {
          errorBox.style.display = "none";
        }, 4000);
      }
      