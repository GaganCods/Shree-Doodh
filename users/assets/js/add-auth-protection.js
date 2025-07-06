/**
 * This script helps add auth-protection.js to all user pages.
 * Run this in the browser console on any page to see which pages need the auth protection script.
 */

// List of all user pages that should have auth protection
const userPages = [
  '../dashboard.html',
  'pages/milk-records.html',
  'pages/statistics.html',
  'pages/sources-pricing.html',
  'pages/notifications.html',
  'pages/profile.html',
  'pages/settings.html'
];

// Function to check if a page has the auth protection script
async function checkAuthProtection(page) {
  try {
    const response = await fetch(page);
    if (!response.ok) {
      return { page, status: 'error', message: `Failed to fetch page: ${response.status}` };
    }
    
    const html = await response.text();
    const hasAuthProtection = html.includes('auth-protection.js');
    
    return {
      page,
      status: hasAuthProtection ? 'protected' : 'unprotected'
    };
  } catch (error) {
    return { page, status: 'error', message: error.message };
  }
}

// Check all pages
async function checkAllPages() {
  console.log('Checking auth protection on user pages...');
  
  const results = await Promise.all(userPages.map(page => checkAuthProtection(page)));
  
  console.log('Results:');
  console.table(results);
  
  const unprotectedPages = results.filter(r => r.status === 'unprotected');
  if (unprotectedPages.length > 0) {
    console.warn('The following pages need auth protection:');
    unprotectedPages.forEach(p => console.warn(`- ${p.page}`));
    console.warn('Add the following script tag before the closing body tag:');
    console.warn('<script src="../assets/js/auth-protection.js"></script>');
  } else {
    console.log('All pages are protected! 🎉');
  }
}

// Run the check
checkAllPages(); 