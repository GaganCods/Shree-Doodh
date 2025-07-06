// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    offset: 100,
    once: true
});

// Check user authentication status when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize calculator
    calculator.init();
    
    // Check if user is logged in
    checkAuthStatus();
});

// Function to check authentication status
function checkAuthStatus() {
    // Check if Firebase is loaded
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in
                showUserDropdown(user);
            } else {
                // No user is signed in
                showLoginButtons();
            }
        });
    } else {
        // If on home page and Firebase is not loaded, check localStorage as fallback
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                showUserDropdown(user);
            } catch (e) {
                showLoginButtons();
            }
        } else {
            showLoginButtons();
        }
    }
}

// Show user dropdown with user info
function showUserDropdown(user) {
    const loggedOutButtons = document.getElementById('loggedOutButtons');
    const userDropdown = document.getElementById('userDropdown');
    const userProfilePic = document.getElementById('userProfilePic');
    const userName = document.getElementById('userName');
    
    if (loggedOutButtons && userDropdown) {
        // Hide login/signup buttons
        loggedOutButtons.style.display = 'none';
        
        // Set user info
        if (user.photoURL) {
            userProfilePic.src = user.photoURL;
        }
        userName.textContent = user.displayName || user.email || 'User';
        
        // Show user dropdown
        userDropdown.style.display = 'flex';
        
        // Add logout functionality
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
    }
}

// Show login/signup buttons
function showLoginButtons() {
    const loggedOutButtons = document.getElementById('loggedOutButtons');
    const userDropdown = document.getElementById('userDropdown');
    
    if (loggedOutButtons && userDropdown) {
        loggedOutButtons.style.display = 'flex';
        userDropdown.style.display = 'none';
    }
}

// Toggle user dropdown menu
function toggleUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('active');
    }
}

// Logout user
function logoutUser() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().signOut().then(() => {
            // Sign-out successful
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Logout Error:', error);
        });
    } else {
        // Fallback for when Firebase is not loaded
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    }
}

// Close user dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userDropdown = document.getElementById('userDropdown');
    const userDropdownToggle = document.querySelector('.user-dropdown-toggle');
    
    if (userDropdown && userDropdownToggle) {
        const clickedInsideDropdown = userDropdown.contains(event.target);
        const clickedOnToggle = userDropdownToggle.contains(event.target);
        
        if (!clickedInsideDropdown || (clickedInsideDropdown && !clickedOnToggle && !event.target.closest('.user-dropdown-menu'))) {
            if (!clickedOnToggle && userDropdown.classList.contains('active')) {
                userDropdown.classList.remove('active');
            }
        }
    }
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navButtons = document.querySelector('.nav-buttons');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    navButtons.classList.toggle('active');
});

// Scroll Blur
  document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar");
    const heroSection = document.querySelector("#home");

    function toggleNavbarBlur() {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      if (heroBottom <= 0) {
        navbar.classList.add("blurred");
      } else {
        navbar.classList.remove("blurred");
      }
    }

    window.addEventListener("scroll", toggleNavbarBlur);
    toggleNavbarBlur();
  });

  // Hamburger Menu
  function toggleMenu() {
    document.querySelector(".navbar").classList.toggle("open");
  }

  function scrollToTop(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

// FAQ accordion
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const toggle = item.querySelector('.faq-toggle');

    question.addEventListener('click', () => {
        // Close all other items
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-toggle').textContent = '+';
            }
        });

        // Toggle current item
        item.classList.toggle('active');
        toggle.textContent = item.classList.contains('active') ? '−' : '+';
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            navButtons.classList.remove('active');
        }
    });
});

// Add active class to nav links on scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLink?.classList.add('active');
        } else {
            navLink?.classList.remove('active');
        }
    });
});

// Add loading animation to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        if (!this.classList.contains('btn-secondary')) {
            const originalText = this.textContent;
            this.textContent = 'Loading...';
            this.disabled = true;

            // Simulate loading (remove in production)
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
            }, 1000);
        }
    });
});

// Milk Calculator Functionality
const calculator = {
    elements: {
        milkType: document.getElementById('milkType'),
        quantity: document.getElementById('quantity'),
        price: document.getElementById('price'),
        days: document.getElementById('days'),
        calculateBtn: document.getElementById('calculateBtn'),
        dailyCost: document.getElementById('dailyCost'),
        dailyQuantity: document.getElementById('dailyQuantity'),
        monthlyCost: document.getElementById('monthlyCost'),
        monthlyQuantity: document.getElementById('monthlyQuantity')
    },

    init() {
        this.elements.calculateBtn.addEventListener('click', () => this.calculate());
        this.setupInputValidation();
    },

    setupInputValidation() {
        const inputs = [this.elements.quantity, this.elements.price, this.elements.days];
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                if (e.target.value < 0) e.target.value = 0;
            });
        });
    },

    calculate() {
        const quantity = parseFloat(this.elements.quantity.value) || 0;
        const price = parseFloat(this.elements.price.value) || 0;
        const days = parseInt(this.elements.days.value) || 30;

        // Calculate daily values
        const dailyCost = quantity * price;
        const dailyQuantity = quantity;

        // Calculate monthly values
        const monthlyCost = dailyCost * days;
        const monthlyQuantity = dailyQuantity * days;

        // Update the UI
        this.updateResults({
            dailyCost,
            dailyQuantity,
            monthlyCost,
            monthlyQuantity
        });

        // Add animation to results
        this.animateResults();
    },

    updateResults(results) {
        this.elements.dailyCost.textContent = `₹${results.dailyCost.toFixed(2)}`;
        this.elements.dailyQuantity.textContent = `${results.dailyQuantity.toFixed(1)} L`;
        this.elements.monthlyCost.textContent = `₹${results.monthlyCost.toFixed(2)}`;
        this.elements.monthlyQuantity.textContent = `${results.monthlyQuantity.toFixed(1)} L`;
    },

    animateResults() {
        const resultCards = document.querySelectorAll('.result-card');
        resultCards.forEach(card => {
            card.style.animation = 'none';
            card.offsetHeight; // Trigger reflow
            card.style.animation = 'fadeIn 0.5s ease-in-out';
        });
    }
};

// Live Preview Tab Switching
const previewTabs = document.querySelectorAll('.preview-tab');
const previewPanels = document.querySelectorAll('.preview-panel');

previewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and panels
        previewTabs.forEach(t => t.classList.remove('active'));
        previewPanels.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding panel
        const panelId = `${tab.dataset.tab}-panel`;
        document.getElementById(panelId).classList.add('active');
    });
}); 

 // Back to top button functionality
 const backToTopButton = document.getElementById("backToTop");
    
 if (backToTopButton) {
     window.addEventListener("scroll", () => {
         if (window.pageYOffset > 300) {
             backToTopButton.classList.add("visible");
         } else {
             backToTopButton.classList.remove("visible");
         }
         
         // Navbar scroll effect
         const navbar = document.getElementById("navbar");
         if (window.scrollY > 10) {
             navbar.classList.add("scrolled");
         } else {
             navbar.classList.remove("scrolled");
         }
     });
     
     backToTopButton.addEventListener("click", (e) => {
         e.preventDefault();
         window.scrollTo({ top: 0, behavior: "smooth" });
     });
 }

 // Common JavaScript for pages (contact-us, privacy-policy, terms-and-conditions)

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animation library
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    // Toggle mobile navigation
    window.toggleMobileNav = function() {
        const navbar = document.getElementById("navbar");
        navbar.classList.toggle("expanded");
        
        // Close user dropdown if open when toggling mobile nav
        const userDropdown = document.getElementById("userDropdown");
        if (userDropdown && userDropdown.classList.contains('active')) {
            userDropdown.classList.remove('active');
        }
    };

    // Toggle user dropdown
    window.toggleUserDropdown = function() {
        const dropdown = document.getElementById("userDropdown");
        dropdown.classList.toggle("active");
    };

    // Back to top button functionality
    const backToTopButton = document.getElementById("backToTop");
    
    if (backToTopButton) {
        window.addEventListener("scroll", () => {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add("visible");
            } else {
                backToTopButton.classList.remove("visible");
            }
            
            // Navbar scroll effect
            const navbar = document.getElementById("navbar");
            if (window.scrollY > 10) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        });
        
        backToTopButton.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Here you would typically send the form data to your server
            // For now, we'll just show the success message
            document.getElementById('successMessage').style.display = 'flex';
            
            // Reset form
            this.reset();
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                document.getElementById('successMessage').style.display = 'none';
            }, 5000);
        });
    }

    // Check if user is logged in
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            const loggedOutButtons = document.getElementById('loggedOutButtons');
            const userDropdown = document.getElementById('userDropdown');
            const userName = document.getElementById('userName');
            const userProfilePic = document.getElementById('userProfilePic');
            
            if (user) {
                // User is signed in
                if (loggedOutButtons) loggedOutButtons.style.display = 'none';
                if (userDropdown) userDropdown.style.display = 'flex';
                if (userName) userName.textContent = user.displayName || user.email;
                if (userProfilePic && user.photoURL) {
                    userProfilePic.src = user.photoURL;
                }
                
                // Setup logout button
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        firebase.auth().signOut().then(function() {
                            window.location.href = '../index.html';
                        }).catch(function(error) {
                            console.error('Sign Out Error', error);
                        });
                    });
                }
            } else {
                // No user is signed in
                if (loggedOutButtons) loggedOutButtons.style.display = 'flex';
                if (userDropdown) userDropdown.style.display = 'none';
            }
        });
    }
}); 