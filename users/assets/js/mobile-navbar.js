/**
 * Mobile Navigation Bar Functionality
 * Handles mobile menu toggle, user info, dark mode, and other mobile-specific features
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get mobile menu elements
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const floatingMobileMenuBtn = document.getElementById('floatingMobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavbar = document.getElementById('mobileNavbar');
    const body = document.body;
    
    // Function to toggle mobile menu
    function toggleMobileMenu() {
        mobileNav.classList.toggle('active');
        if (mobileMenuToggle) mobileMenuToggle.classList.toggle('active');
        if (floatingMobileMenuBtn) floatingMobileMenuBtn.classList.toggle('active');
        body.classList.toggle('mobile-nav-open');
    }
    
    // Add click event to toggle mobile menu
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Add click event to floating menu button
    if (floatingMobileMenuBtn && mobileNav) {
        floatingMobileMenuBtn.addEventListener('click', function() {
            // If navbar is not visible, make it visible first
            if (window.getComputedStyle(mobileNavbar).display === 'none') {
                mobileNavbar.style.display = 'flex';
                setTimeout(toggleMobileMenu, 10); // Slight delay for animation
            } else {
                toggleMobileMenu();
            }
        });
    }
    
    // Mobile user profile dropdown functionality
    const mobileUserProfile = document.querySelector('.mobile-user-profile');
    const mobileUserDropdown = document.getElementById('mobileUserDropdown');
    
    if (mobileUserProfile && mobileUserDropdown) {
        mobileUserProfile.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            mobileUserDropdown.classList.toggle('show');
            
            // Close dropdown when clicking outside
            const closeMobileDropdown = function(event) {
                if (!mobileUserProfile.contains(event.target) && !mobileUserDropdown.contains(event.target)) {
                    mobileUserDropdown.classList.remove('show');
                    document.removeEventListener('click', closeMobileDropdown);
                }
            };
            
            // Add the event listener after a small delay to prevent immediate closing
            setTimeout(() => {
                document.addEventListener('click', closeMobileDropdown);
            }, 10);
        });
        
        // Prevent clicks inside dropdown from closing it
        mobileUserDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Mobile logout functionality - both buttons
    const logoutButtons = [
        document.getElementById('mobileLogoutBtn'),
        document.getElementById('mobileDropdownLogoutBtn')
    ];
    
    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Use global logout function if available
                if (typeof window.logoutUser === 'function') {
                    window.logoutUser();
                } else {
                    // Fallback logout
                    firebase.auth().signOut().then(function() {
                        localStorage.removeItem('milkMate_userData');
                        // Determine the correct path based on current location
                        const isInSubfolder = window.location.pathname.includes('/pages/');
                        const loginPath = isInSubfolder ? '../auth/login.html' : 'auth/login.html';
                        window.location.href = loginPath;
                    }).catch(function(error) {
                        console.error('Logout failed:', error);
                    });
                }
            });
        }
    });
    
    // Mobile dark mode toggles - both in main menu and dropdown
    const mobileDropdownDarkModeToggle = document.getElementById('mobileDropdownDarkModeToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (mobileDropdownDarkModeToggle) {
        // Check saved preference
        const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
        
        if (darkModeEnabled) {
            document.body.classList.add('dark-mode');
            mobileDropdownDarkModeToggle.checked = true;
            if (darkModeToggle) darkModeToggle.checked = true;
        }
        
        mobileDropdownDarkModeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode', this.checked);
            localStorage.setItem('darkMode', this.checked);
            if (darkModeToggle) darkModeToggle.checked = this.checked;
        });
    }
    
    // Mobile notifications toggles - both in main menu and dropdown
    const mobileDropdownNotificationsToggle = document.getElementById('mobileDropdownNotificationsToggle');
    
    if (mobileDropdownNotificationsToggle) {
        // Check saved preference
        const notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
        
        if (!notificationsEnabled) {
            mobileDropdownNotificationsToggle.checked = false;
        }
        
        mobileDropdownNotificationsToggle.addEventListener('change', function() {
            localStorage.setItem('notificationsEnabled', this.checked);
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileNav && mobileNav.classList.contains('active') && 
            !mobileNav.contains(e.target) && 
            !mobileMenuToggle?.contains(e.target) &&
            !floatingMobileMenuBtn?.contains(e.target)) {
            mobileNav.classList.remove('active');
            if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
            if (floatingMobileMenuBtn) floatingMobileMenuBtn.classList.remove('active');
            body.classList.remove('mobile-nav-open');
            
            // Reset icon
            const icon = mobileMenuToggle?.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
    
    // Initialize mobile user info
    function updateMobileUserInfo() {
        const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
        
        // Update user info in the nav menu
        const mobileUserName = document.getElementById('mobileUserName');
        const mobileUserEmail = document.getElementById('mobileUserEmail');
        const mobileUserAvatar = document.getElementById('mobileUserAvatar');
        
        // Update user info in the header
        const mobileHeaderUsername = document.getElementById('mobileHeaderUsername');
        const mobileHeaderAvatar = document.getElementById('mobileHeaderAvatar');
        
        if (userData.displayName) {
            if (mobileUserName) mobileUserName.textContent = userData.displayName;
            if (mobileHeaderUsername) mobileHeaderUsername.textContent = userData.displayName.split(' ')[0]; // Show first name only in header
        }
        
        if (userData.email) {
            if (mobileUserEmail) mobileUserEmail.textContent = userData.email;
        }
        
        if (userData.photoURL) {
            if (mobileUserAvatar) mobileUserAvatar.src = userData.photoURL;
            if (mobileHeaderAvatar) mobileHeaderAvatar.src = userData.photoURL;
        }
    }
    
    // Call the function to update mobile user info
    updateMobileUserInfo();
    
    // Set active nav item based on current page
    function setActiveNavItem() {
        const currentPath = window.location.pathname;
        
        // Remove all active classes first
        document.querySelectorAll('.mobile-nav a').forEach(item => {
            item.classList.remove('active');
        });
        
        // Set active class based on current path
        if (currentPath.includes('dashboard.html')) {
            document.getElementById('navDashboard')?.classList.add('active');
        } else if (currentPath.includes('milk-records.html')) {
            document.getElementById('navMilkRecords')?.classList.add('active');
        } else if (currentPath.includes('statistics.html')) {
            document.getElementById('navStatistics')?.classList.add('active');
        } else if (currentPath.includes('sources-pricing.html')) {
            document.getElementById('navSources')?.classList.add('active');
        } else if (currentPath.includes('settings.html')) {
            document.getElementById('navSettings')?.classList.add('active');
        }
    }
    
    // Set active nav item on page load
    setActiveNavItem();
    
    // Refresh button functionality
    const navRefresh = document.getElementById('navRefresh');
    if (navRefresh) {
        navRefresh.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.reload();
        });
    }
    
    // Mobile change password functionality - both buttons
    const mobileChangePasswordBtn = document.getElementById('mobileChangePasswordBtn');
    
    if (mobileChangePasswordBtn) {
        mobileChangePasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if we're in a subdirectory
            const isSubdirectory = window.location.pathname.includes('/pages/');
            const resetPath = isSubdirectory ? "../auth/reset.html" : "auth/reset.html";
            
            window.location.href = resetPath;
        });
    }
    
    // Mobile header user click to open menu
    const mobileHeaderUser = document.getElementById('mobileHeaderUser');
    if (mobileHeaderUser && mobileMenuToggle) {
        mobileHeaderUser.addEventListener('click', function() {
            if (!mobileNav.classList.contains('active')) {
                mobileMenuToggle.click();
            }
        });
    }
    
    // Mobile help center button
    const navHelp = document.getElementById('navHelp');
    
    if (navHelp) {
        navHelp.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Help Center will be available soon!');
        });
    }
}); 