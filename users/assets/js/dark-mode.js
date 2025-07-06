// Dark Mode Utility Functions

// Apply dark mode on page load
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    setupDarkModeObserver();
});

// Initialize dark mode from localStorage
function initDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    console.log('Initial dark mode state:', darkModeEnabled);
    
    // Apply dark mode if enabled
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Update all toggle states
    syncAllDarkModeToggles(darkModeEnabled);
}

// Global function for toggling dark mode
function toggleDarkMode(enable) {
    console.log('Toggle dark mode called with:', enable);
    
    // Apply dark mode to body
    if (enable) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
    
    // Sync all toggles
    syncAllDarkModeToggles(enable);
    
    console.log('Dark mode is now:', enable ? 'enabled' : 'disabled');
}

// Sync all dark mode toggles
function syncAllDarkModeToggles(enabled) {
    // Get all dark mode toggle inputs - use a more general selector to catch all toggles
    const darkModeToggles = document.querySelectorAll('input[type="checkbox"][id*="darkModeToggle"], input[type="checkbox"][id*="DarkModeToggle"]');
    
    // Update all toggles
    darkModeToggles.forEach(toggle => {
        toggle.checked = enabled;
    });
    
    console.log('Synced all dark mode toggles:', darkModeToggles.length, 'toggles found');
}

// Setup observer to watch for dynamically added dark mode toggles
function setupDarkModeObserver() {
    // Create a MutationObserver to watch for new elements
    const observer = new MutationObserver(function(mutations) {
        // Check if we need to update any newly added toggles
        const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
        
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                // Check if any of the added nodes contain dark mode toggles
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        const newToggles = node.querySelectorAll ? 
                            node.querySelectorAll('input[type="checkbox"][id*="darkModeToggle"], input[type="checkbox"][id*="DarkModeToggle"]') : 
                            [];
                            
                        if (newToggles.length > 0) {
                            console.log('Found new dark mode toggles:', newToggles.length);
                            newToggles.forEach(toggle => {
                                toggle.checked = darkModeEnabled;
                            });
                        }
                        
                        // If the node itself is a toggle
                        if (node.id && (node.id.includes('darkModeToggle') || node.id.includes('DarkModeToggle'))) {
                            node.checked = darkModeEnabled;
                        }
                    }
                });
            }
        });
    });
    
    // Start observing the document body for DOM changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Apply dark mode immediately on script load
(function() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        
        // Also try to set any toggle that might be already in the DOM
        setTimeout(() => {
            const darkModeToggles = document.querySelectorAll('input[type="checkbox"][id*="darkModeToggle"], input[type="checkbox"][id*="DarkModeToggle"]');
            darkModeToggles.forEach(toggle => {
                toggle.checked = true;
            });
        }, 0);
    }
})(); 