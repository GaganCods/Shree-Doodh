// Sidebar Navigation JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar collapse functionality
    const sidebar = document.querySelector('.sidebar');
    const sidebarCollapseBtn = document.querySelector('.sidebar-collapse-btn');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarCollapseBtn && sidebar) {
        sidebarCollapseBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            if (mainContent) {
                mainContent.classList.toggle('expanded');
            }
            
            // Change the icon direction
            const icon = this.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-left');
            }
            
            // Save sidebar state to localStorage
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            
            // Reposition user dropdown when sidebar is toggled
            positionUserDropdown();
        });
    }
    
    // Mobile bottom navigation more menu
    const mobileNavMore = document.getElementById('mobileNavMore');
    const mobileMoreMenu = document.getElementById('mobileMoreMenu');
    const mobileMoreCloseBtn = document.getElementById('mobileMoreCloseBtn');
    
    if (mobileNavMore) {
        // The more button now links directly to profile page
        // No need to show the more menu
        
        // But we'll keep the more menu functionality for the close button
        if (mobileMoreCloseBtn) {
            mobileMoreCloseBtn.addEventListener('click', function() {
                mobileMoreMenu.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
            });
        }
        
        // Close more menu when clicking outside
        document.addEventListener('click', function(e) {
            if (mobileMoreMenu && 
                mobileMoreMenu.classList.contains('active') && 
                !mobileMoreMenu.contains(e.target)) {
                mobileMoreMenu.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
            }
        });
    }
    
    // Set active nav item based on current page
    function setActiveNavItems() {
        const currentPath = window.location.pathname;
        
        // Remove all active classes first
        document.querySelectorAll('.sidebar .nav-link').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.mobile-bottom-navbar .mobile-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Set active class based on current path
        if (currentPath.includes('dashboard.html')) {
            document.querySelector('.nav-link[href*="dashboard.html"]')?.classList.add('active');
            document.querySelector('.mobile-nav-item[href*="dashboard.html"]')?.classList.add('active');
        } else if (currentPath.includes('milk-records.html')) {
            document.querySelector('.nav-link[href*="milk-records.html"]')?.classList.add('active');
            document.querySelector('.mobile-nav-item[href*="milk-records.html"]')?.classList.add('active');
        } else if (currentPath.includes('statistics.html')) {
            document.querySelector('.nav-link[href*="statistics.html"]')?.classList.add('active');
            document.querySelector('.mobile-nav-item[href*="statistics.html"]')?.classList.add('active');
        } else if (currentPath.includes('sources-pricing.html')) {
            document.querySelector('.nav-link[href*="sources-pricing.html"]')?.classList.add('active');
            document.querySelector('.mobile-nav-item[href*="sources-pricing.html"]')?.classList.add('active');
        } else if (currentPath.includes('notifications.html')) {
            document.querySelector('.nav-link[href*="notifications.html"]')?.classList.add('active');
        } else if (currentPath.includes('profile.html')) {
            document.querySelector('.mobile-nav-item[href*="profile.html"]')?.classList.add('active');
        }
    }
    
    // Initialize user info
    function updateUserInfo() {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
        
        // Update sidebar user info
        const sidebarUserName = document.querySelector('.sidebar-user .user-name');
        const sidebarUserEmail = document.querySelector('.sidebar-user .user-email');
        const sidebarUserAvatar = document.querySelector('.sidebar-user .user-avatar');
        
        // Update dropdown user info
        const dropdownUserName = document.querySelector('.user-dropdown-menu .dropdown-user-name');
        const dropdownUserEmail = document.querySelector('.user-dropdown-menu .dropdown-user-email');
        const dropdownUserAvatar = document.querySelector('.user-dropdown-menu .dropdown-user-avatar');
        
        // Update mobile more menu user info
        const mobileMoreUserName = document.querySelector('.mobile-more-menu .mobile-more-user-name');
        const mobileMoreUserEmail = document.querySelector('.mobile-more-menu .mobile-more-user-email');
        const mobileMoreUserAvatar = document.querySelector('.mobile-more-menu .mobile-more-avatar');
        
        // Update mobile nav avatar
        const mobileNavAvatar = document.querySelector('.mobile-nav-avatar img');
        
        if (userData.displayName) {
            if (sidebarUserName) sidebarUserName.textContent = userData.displayName;
            if (dropdownUserName) dropdownUserName.textContent = userData.displayName;
            if (mobileMoreUserName) mobileMoreUserName.textContent = userData.displayName;
        }
        
        if (userData.email) {
            if (sidebarUserEmail) sidebarUserEmail.textContent = userData.email;
            if (dropdownUserEmail) dropdownUserEmail.textContent = userData.email;
            if (mobileMoreUserEmail) mobileMoreUserEmail.textContent = userData.email;
        }
        
        if (userData.photoURL) {
            if (sidebarUserAvatar) sidebarUserAvatar.src = userData.photoURL;
            if (dropdownUserAvatar) dropdownUserAvatar.src = userData.photoURL;
            if (mobileMoreUserAvatar) mobileMoreUserAvatar.src = userData.photoURL;
            if (mobileNavAvatar) mobileNavAvatar.src = userData.photoURL;
        }
        
        // Load the most up-to-date profile picture from Firebase
        if (typeof loadUserProfilePic === 'function') {
            loadUserProfilePic();
        }
    }
    
    // Function to position the user dropdown
    function positionUserDropdown() {
        const userContainer = document.querySelector('.sidebar-user');
        const userDropdown = document.querySelector('.user-dropdown-menu');
        const sidebar = document.querySelector('.sidebar');
        
        if (!userContainer || !userDropdown || !sidebar) return;
        
        const rect = userContainer.getBoundingClientRect();
        
        // Position above the user container
        userDropdown.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        
        // Adjust horizontal position based on sidebar state
        if (sidebar.classList.contains('collapsed')) {
            userDropdown.style.left = '70px';
        } else {
            userDropdown.style.left = '16px';
        }
    }
    
    // Check for saved sidebar state
    if (localStorage.getItem('sidebarCollapsed') === 'true' && sidebar) {
        sidebar.classList.add('collapsed');
        if (mainContent) {
            mainContent.classList.add('expanded');
        }
        if (sidebarCollapseBtn) {
            const icon = sidebarCollapseBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            }
        }
        // Ensure dropdown positioning is updated when sidebar state is restored
        setTimeout(positionUserDropdown, 100);
    }
    
    // Initialize
    setActiveNavItems();
    updateUserInfo();
    positionUserDropdown();
    
    // Initialize dropdown position
    setTimeout(positionUserDropdown, 300);
});

// Global function for toggling user dropdown
function toggleUserDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const userContainer = document.querySelector('.sidebar-user');
    const userDropdown = document.querySelector('.user-dropdown-menu');
    const userDropdownArrow = document.querySelector('.dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');
    
    if (userDropdown && userContainer) {
        // Toggle dropdown visibility
        const isActive = userDropdown.classList.contains('active');
        userDropdown.classList.toggle('active');
        
        // Position the dropdown when opening
        if (!isActive) {
            const rect = userContainer.getBoundingClientRect();
            
            // Position above the user container
            userDropdown.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
            
            // Adjust horizontal position based on sidebar state
            if (sidebar && sidebar.classList.contains('collapsed')) {
                userDropdown.style.left = '70px';
            } else {
                userDropdown.style.left = '16px';
            }
        }
    }
    
    if (userDropdownArrow) {
        userDropdownArrow.classList.toggle('rotated');
    }
}

// Function to position the user dropdown
function positionUserDropdown() {
    const userContainer = document.querySelector('.sidebar-user');
    const userDropdown = document.querySelector('.user-dropdown-menu');
    const sidebar = document.querySelector('.sidebar');
    
    if (!userContainer || !userDropdown || !sidebar) return;
    
    const rect = userContainer.getBoundingClientRect();
    
    // Position above the user container
    userDropdown.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    
    // Adjust horizontal position based on sidebar state
    if (sidebar.classList.contains('collapsed')) {
        userDropdown.style.left = '70px';
    } else {
        userDropdown.style.left = '16px';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userContainer = document.querySelector('.sidebar-user');
    const userDropdown = document.querySelector('.user-dropdown-menu');
    const userDropdownArrow = document.querySelector('.dropdown-arrow');
    
    if (!userContainer || !userDropdown) return;
    
    const isClickInside = userContainer.contains(event.target) || userDropdown.contains(event.target);
    
    if (!isClickInside && userDropdown.classList.contains('active')) {
        userDropdown.classList.remove('active');
        if (userDropdownArrow) {
            userDropdownArrow.classList.remove('rotated');
        }
    }
});

// Reposition dropdown on window resize
window.addEventListener('resize', function() {
    const userDropdown = document.querySelector('.user-dropdown-menu');
    if (userDropdown && userDropdown.classList.contains('active')) {
        positionUserDropdown();
    }
});