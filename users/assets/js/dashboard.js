// Load sidebar component
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard functionality
    setGreeting();
    checkAuth();
    setupSidebarFunctionality();
    setupModalFunctionality();
    
    // These functions will be updated with real data
    setupBudgetTracking();
    setupNotes();
    
    // Chart period buttons functionality
    document.querySelectorAll('.chart-period-btn').forEach(button => {
        button.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.chart-period-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update chart data based on the selected period
            const period = this.getAttribute('data-period');
            updateChartsForPeriod(period);
        });
    });
    
    // Chart type buttons functionality
    document.querySelectorAll('.chart-type-btn').forEach(button => {
        button.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.chart-type-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update chart data based on the selected type
            const type = this.getAttribute('data-type');
            updateExpenseChartByType(type);
        });
    });
});

// Set greeting based on time of day
function setGreeting() {
    const hour = new Date().getHours();
    const greetingText = document.getElementById('greetingText');
    let greeting = 'Good morning';
    
    if (hour >= 12 && hour < 17) {
        greeting = 'Good afternoon';
    } else if (hour >= 17) {
        greeting = 'Good evening';
    }
    
    if (greetingText) {
        greetingText.innerHTML = `${greeting}, <span id="userNameGreeting">User</span>!`;
    }
}

// Generate calendar
function generateCalendar() {
    const calendarContainer = document.getElementById('milkCalendar');
    if (!calendarContainer) return;
    
    // Clear existing calendar
    calendarContainer.innerHTML = '';
    
    // Create weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayRow = document.createElement('div');
    weekdayRow.className = 'calendar-row weekdays';
    
    weekdays.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-cell weekday';
        dayEl.textContent = day;
        weekdayRow.appendChild(dayEl);
    });
    
    calendarContainer.appendChild(weekdayRow);
    
    // Get current month days
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Fetch milk record data for the current month
    if (firebase.auth().currentUser) {
        const startDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
        const endDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
        
        firebase.database().ref('milkRecords')
            .child(firebase.auth().currentUser.uid)
            .orderByChild('date')
            .startAt(startDate)
            .endAt(endDate)
            .once('value')
            .then((snapshot) => {
                // Organize records by day
                const recordsByDay = {};
                snapshot.forEach((childSnapshot) => {
                    const record = childSnapshot.val();
                    const day = new Date(record.date).getDate();
                    if (!recordsByDay[day]) {
                        recordsByDay[day] = [];
                    }
                    recordsByDay[day].push(record);
                });
                
                // Create calendar grid with record data
                createCalendarGrid(firstDay, daysInMonth, recordsByDay, calendarContainer);
            })
            .catch(error => {
                console.error("Error fetching milk records for calendar:", error);
                // Create calendar grid without record data
                createCalendarGrid(firstDay, daysInMonth, {}, calendarContainer);
            });
    } else {
        // Create calendar grid without record data
        createCalendarGrid(firstDay, daysInMonth, {}, calendarContainer);
    }
}

// Helper function to create the calendar grid
function createCalendarGrid(firstDay, daysInMonth, recordsByDay, calendarContainer) {
    let dayCount = 1;
    const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;
    const now = new Date();
    
    for (let i = 0; i < totalCells / 7; i++) {
        const row = document.createElement('div');
        row.className = 'calendar-row';
        
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            
            if ((i === 0 && j < firstDay) || dayCount > daysInMonth) {
                // Empty cell
                cell.className += ' empty';
            } else {
                // Day cell
                cell.textContent = dayCount;
                
                // Add status classes based on record data
                if (recordsByDay[dayCount] && recordsByDay[dayCount].length > 0) {
                    cell.className += ' received';
                    
                    // Check if extra milk was recorded this day
                    const extraMilk = recordsByDay[dayCount].find(r => r.isExtra === true);
                    if (extraMilk) {
                        cell.className += ' extra';
                    }
                } else {
                    // Check if the date is in the past (missed) or future (not yet)
                    const cellDate = new Date(now.getFullYear(), now.getMonth(), dayCount);
                    if (cellDate < now && cellDate.getDate() !== now.getDate()) {
                        cell.className += ' missed';
                    }
                }
                
                // Add current day indicator
                if (dayCount === now.getDate()) {
                    cell.className += ' today';
                }
                
                dayCount++;
            }
            
            row.appendChild(cell);
        }
        
        calendarContainer.appendChild(row);
    }
}

// Load dashboard data for the current user
function loadDashboardData() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const uid = user.uid;
    
    // Show loading indicators
    document.getElementById('todayMilkValue').textContent = 'Loading...';
    document.getElementById('todayExpenseValue').textContent = 'Loading...';
    document.getElementById('monthlyMilkValue').textContent = 'Loading...';
    document.getElementById('monthlyExpenseValue').textContent = 'Loading...';
    document.getElementById('avgPriceValue').textContent = 'Loading...';
    document.getElementById('sourcesValue').textContent = 'Loading...';
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];
    
    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayFormatted = firstDayOfMonth.toISOString().split('T')[0];
    
    // Get last day of current month
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const lastDayFormatted = lastDayOfMonth.toISOString().split('T')[0];
    
    // 1. Fetch today's milk records
    fetchTodaysMilkData(uid, todayFormatted, yesterdayFormatted);
    
    // 2. Fetch monthly milk records
    fetchMonthlyMilkData(uid, firstDayFormatted, lastDayFormatted);
    
    // 3. Fetch sources count
    fetchSourcesData(uid);
    
    // 4. Generate calendar with real data
    generateCalendar();
    
    // 5. Initialize charts with real data
    initChartsWithRealData(uid);
    
    // 6. Also refresh budget and notes displays
    setupBudgetTracking();
    setupNotes();
}

// Fetch today's milk data
function fetchTodaysMilkData(uid, todayFormatted, yesterdayFormatted) {
    // Fetch today's data
    firebase.database().ref('milkRecords')
        .child(uid)
        .orderByChild('date')
        .equalTo(todayFormatted)
        .once('value')
        .then(snapshot => {
            let todayTotal = 0;
            let todayExpense = 0;
            
            snapshot.forEach(childSnapshot => {
                const record = childSnapshot.val();
                todayTotal += parseFloat(record.quantity) || 0;
                todayExpense += parseFloat(record.price) || 0;
            });
            
            // Update UI
            document.getElementById('todayMilkValue').textContent = `${todayTotal.toFixed(1)} L`;
            document.getElementById('todayExpenseValue').textContent = `₹${todayExpense.toFixed(2)}`;
            
            // Fetch yesterday's data for comparison
            firebase.database().ref('milkRecords')
                .child(uid)
                .orderByChild('date')
                .equalTo(yesterdayFormatted)
                .once('value')
                .then(yesterdaySnapshot => {
                    let yesterdayTotal = 0;
                    let yesterdayExpense = 0;
                    
                    yesterdaySnapshot.forEach(childSnapshot => {
                        const record = childSnapshot.val();
                        yesterdayTotal += parseFloat(record.quantity) || 0;
                        yesterdayExpense += parseFloat(record.price) || 0;
                    });
                    
                    // Calculate differences
                    const milkDiff = todayTotal - yesterdayTotal;
                    const expenseDiff = todayExpense - yesterdayExpense;
                    
                    // Update change indicators
                    const todayMilkChange = document.getElementById('todayMilkChange');
                    const todayExpenseChange = document.getElementById('todayExpenseChange');
                    
                    if (milkDiff > 0) {
                        todayMilkChange.textContent = `+${milkDiff.toFixed(1)} L from yesterday`;
                        todayMilkChange.className = 'stat-change positive';
                    } else if (milkDiff < 0) {
                        todayMilkChange.textContent = `${milkDiff.toFixed(1)} L from yesterday`;
                        todayMilkChange.className = 'stat-change negative';
                    } else {
                        todayMilkChange.textContent = 'Same as yesterday';
                        todayMilkChange.className = 'stat-change neutral';
                    }
                    
                    if (expenseDiff > 0) {
                        todayExpenseChange.textContent = `+₹${expenseDiff.toFixed(2)} from yesterday`;
                        todayExpenseChange.className = 'stat-change negative';  // Higher expense is negative
                    } else if (expenseDiff < 0) {
                        todayExpenseChange.textContent = `-₹${Math.abs(expenseDiff).toFixed(2)} from yesterday`;
                        todayExpenseChange.className = 'stat-change positive';  // Lower expense is positive
                    } else {
                        todayExpenseChange.textContent = 'Same as yesterday';
                        todayExpenseChange.className = 'stat-change neutral';
                    }
                })
                .catch(error => {
                    console.error("Error fetching yesterday's data:", error);
                    document.getElementById('todayMilkChange').textContent = 'Data not available';
                    document.getElementById('todayExpenseChange').textContent = 'Data not available';
                });
        })
        .catch(error => {
            console.error("Error fetching today's data:", error);
            document.getElementById('todayMilkValue').textContent = '0 L';
            document.getElementById('todayExpenseValue').textContent = '₹0.00';
            document.getElementById('todayMilkChange').textContent = 'Data not available';
            document.getElementById('todayExpenseChange').textContent = 'Data not available';
        });
}

// Fetch monthly milk data
function fetchMonthlyMilkData(uid, firstDayFormatted, lastDayFormatted) {
    firebase.database().ref('milkRecords')
        .child(uid)
        .orderByChild('date')
        .startAt(firstDayFormatted)
        .endAt(lastDayFormatted)
        .once('value')
        .then(snapshot => {
            let monthlyTotal = 0;
            let monthlyExpense = 0;
            let totalQuantity = 0;
            
            snapshot.forEach(childSnapshot => {
                const record = childSnapshot.val();
                const quantity = parseFloat(record.quantity) || 0;
                const price = parseFloat(record.price) || 0;
                
                monthlyTotal += quantity;
                monthlyExpense += price;
                totalQuantity += quantity;
            });
            
            // Update UI
            document.getElementById('monthlyMilkValue').textContent = `${monthlyTotal.toFixed(1)} L`;
            document.getElementById('monthlyExpenseValue').textContent = `₹${monthlyExpense.toFixed(2)}`;
            
            // Calculate average price per liter
            const avgPrice = totalQuantity > 0 ? monthlyExpense / totalQuantity : 0;
            document.getElementById('avgPriceValue').textContent = `₹${avgPrice.toFixed(2)}`;
            
            // Fetch previous month's average for comparison
            const prevMonthStart = new Date(firstDayFormatted);
            prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
            const prevMonthEnd = new Date(firstDayFormatted);
            prevMonthEnd.setDate(prevMonthEnd.getDate() - 1);
            
            const prevMonthStartFormatted = prevMonthStart.toISOString().split('T')[0];
            const prevMonthEndFormatted = prevMonthEnd.toISOString().split('T')[0];
            
            firebase.database().ref('milkRecords')
                .child(uid)
                .orderByChild('date')
                .startAt(prevMonthStartFormatted)
                .endAt(prevMonthEndFormatted)
                .once('value')
                .then(prevSnapshot => {
                    let prevMonthlyExpense = 0;
                    let prevMonthlyQuantity = 0;
                    
                    prevSnapshot.forEach(childSnapshot => {
                        const record = childSnapshot.val();
                        prevMonthlyExpense += parseFloat(record.price) || 0;
                        prevMonthlyQuantity += parseFloat(record.quantity) || 0;
                    });
                    
                    const prevAvgPrice = prevMonthlyQuantity > 0 ? prevMonthlyExpense / prevMonthlyQuantity : 0;
                    const priceDiff = avgPrice - prevAvgPrice;
                    
                    // Update average price change indicator
                    const avgPriceChange = document.getElementById('avgPriceChange');
                    
                    if (priceDiff > 0.5) {
                        avgPriceChange.textContent = `+₹${priceDiff.toFixed(2)} from last month`;
                        avgPriceChange.className = 'stat-change negative';  // Higher price is negative
                    } else if (priceDiff < -0.5) {
                        avgPriceChange.textContent = `-₹${Math.abs(priceDiff).toFixed(2)} from last month`;
                        avgPriceChange.className = 'stat-change positive';  // Lower price is positive
                    } else {
                        avgPriceChange.textContent = 'Similar to last month';
                        avgPriceChange.className = 'stat-change neutral';
                    }
                })
                .catch(error => {
                    console.error("Error fetching previous month's data:", error);
                    document.getElementById('avgPriceChange').textContent = 'No previous data';
                });
        })
        .catch(error => {
            console.error("Error fetching monthly data:", error);
            document.getElementById('monthlyMilkValue').textContent = '0 L';
            document.getElementById('monthlyExpenseValue').textContent = '₹0.00';
            document.getElementById('avgPriceValue').textContent = '₹0.00';
            document.getElementById('avgPriceChange').textContent = 'Data not available';
        });
}

// Fetch sources data
function fetchSourcesData(uid) {
    firebase.database().ref('sources')
        .child(uid)
        .once('value')
        .then(snapshot => {
            const sourcesCount = snapshot.numChildren();
            document.getElementById('sourcesValue').textContent = sourcesCount;
            
            // Check if this is more or less than previous month
            // For now, we'll just set a static message
            if (sourcesCount === 0) {
                document.getElementById('sourcesChange').textContent = 'Add your first source';
                document.getElementById('sourcesCard').addEventListener('click', () => {
                    window.location.href = 'pages/sources-pricing.html';
                });
            } else {
                document.getElementById('sourcesChange').textContent = `${sourcesCount} active source${sourcesCount !== 1 ? 's' : ''}`;
            }
        })
        .catch(error => {
            console.error("Error fetching sources data:", error);
            document.getElementById('sourcesValue').textContent = '0';
            document.getElementById('sourcesChange').textContent = 'Data not available';
        });
}

// Initialize charts with real data from Firebase
function initChartsWithRealData(uid) {
    // This will be implemented to fetch real data for each chart
    fetchDataForTrendChart(uid);
    fetchDataForExpenseChart(uid);
    fetchDataForSourceChart(uid);
    fetchDataForFrequencyChart(uid);
}

// Initialize charts
function initCharts() {
    // We'll initialize charts with real data in loadDashboardData
    console.log('Charts will be initialized with real data when user is authenticated');
}

// Check authentication status
function checkAuth() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log('User is signed in:', user.email);
            // Load user profile data
            loadUserData(user);
            
            // Load dashboard data from Firebase
            loadDashboardData();
        } else {
            console.log('No user is signed in');
            window.location.href = 'auth/login.html';
        }
    });
}

// Load user data from localStorage for instant display
function loadFromLocalStorage() {
    try {
        const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
        
        if (userData && (userData.displayName || userData.fullName)) {
            // We have user data in localStorage, update UI immediately
            console.log('Loading user data from localStorage for instant display');
            
            // If photoURL needs path correction
            if (userData.photoURL && userData.photoURL.includes('assets/images/user.png')) {
                userData.photoURL = getDefaultProfilePic();
            }
            
            updateUserInfo(userData);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Get the correct path for the default profile picture based on current page location
function getDefaultProfilePic() {
    // Check if we're in a subdirectory by looking at the URL
    const isInSubdirectory = window.location.pathname.includes('/pages/') || 
                             window.location.pathname.includes('/auth/');
    
    // Return the appropriate path
    return isInSubdirectory ? '../assets/images/user.png' : 'assets/images/user.png';
}

// Load user data from Firebase database
function loadUserData(user) {
    // Try to get user data from database first
    firebase.database().ref('users/' + user.uid).once('value').then(function(snapshot) {
        const userData = snapshot.val() || {};
        
        // Create a complete user data object
        const completeUserData = {
            uid: user.uid,
            displayName: userData.fullName || user.displayName || 'User',
            email: user.email || userData.email || '',
            photoURL: userData.photoURL || user.photoURL || getDefaultProfilePic(),
            mobile: userData.mobile || ''
        };
        
        // Save to localStorage
        localStorage.setItem('milkMate_userData', JSON.stringify(completeUserData));
        
        // Update UI with user data
        updateUserInfo(completeUserData);
        
        // If this is a new user with no data in database, create their profile
        if (!snapshot.exists()) {
            console.log('Creating new user profile in database');
            firebase.database().ref('users/' + user.uid).set({
                fullName: user.displayName || 'User',
                email: user.email,
                photoURL: user.photoURL || getDefaultProfilePic(),
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    }).catch(function(error) {
        console.error('Error loading user data:', error);
        
        // Fallback to auth data
        const fallbackData = {
            uid: user.uid,
            displayName: user.displayName || 'User',
            email: user.email || '',
            photoURL: user.photoURL || getDefaultProfilePic()
        };
        
        localStorage.setItem('milkMate_userData', JSON.stringify(fallbackData));
        updateUserInfo(fallbackData);
    });
}

// Update user info
function updateUserInfo(user) {
    // Demo user data for testing if no user is provided
    let userData;
    
    if (user) {
        // Use provided user data
        userData = user;
    } else {
        // Demo user data for testing
        userData = {
            uid: 'demo-user-id',
            displayName: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            photoURL: getDefaultProfilePic()
        };
        
        // Save demo data to localStorage
        localStorage.setItem('milkMate_userData', JSON.stringify(userData));
    }
    
    // Update greeting
    const userNameGreeting = document.getElementById('userNameGreeting');
    if (userNameGreeting) {
        userNameGreeting.textContent = userData.displayName;
    }
    
    // Force update of sidebar and mobile navbar user data
    updateComponentUserData();
}

// Function to update user data in sidebar and mobile navbar
function updateComponentUserData() {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('milkMate_userData') || '{}');
    
    // Update sidebar user info if elements exist
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    
    if (sidebarUserName) sidebarUserName.textContent = userData.displayName || userData.fullName || 'User Name';
    if (sidebarUserEmail) sidebarUserEmail.textContent = userData.email || 'user@example.com';
    if (sidebarUserAvatar) sidebarUserAvatar.src = userData.photoURL || getDefaultProfilePic();
    
    // Update dropdown user info
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    const dropdownUserAvatar = document.getElementById('dropdownUserAvatar');
    
    if (dropdownUserName) dropdownUserName.textContent = userData.displayName || userData.fullName || 'User Name';
    if (dropdownUserEmail) dropdownUserEmail.textContent = userData.email || 'user@example.com';
    if (dropdownUserAvatar) dropdownUserAvatar.src = userData.photoURL || getDefaultProfilePic();
    
    // Update mobile nav user info
    const mobileNavAvatar = document.getElementById('mobileNavAvatar');
    if (mobileNavAvatar) mobileNavAvatar.src = userData.photoURL || getDefaultProfilePic();
}

// Setup sidebar functionality
function setupSidebarFunctionality() {
    // We'll rely on the sidebar-navbar.js implementation for sidebar collapse functionality
    // Just set active nav items here
    setActiveNavItems();
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
        document.getElementById('navDashboard')?.classList.add('active');
        document.getElementById('mobileNavDashboard')?.classList.add('active');
    } else if (currentPath.includes('milk-records.html')) {
        document.getElementById('navMilkRecords')?.classList.add('active');
        document.getElementById('mobileNavRecords')?.classList.add('active');
    } else if (currentPath.includes('statistics.html')) {
        document.getElementById('navStatistics')?.classList.add('active');
        document.getElementById('mobileNavStats')?.classList.add('active');
    } else if (currentPath.includes('sources-pricing.html')) {
        document.getElementById('navSources')?.classList.add('active');
        document.getElementById('mobileNavSources')?.classList.add('active');
    }
}

// Setup budget tracking functionality
function setupBudgetTracking() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const uid = user.uid;
    
    // Show loading state
    const budgetCard = document.querySelector('.budget-card');
    if (budgetCard) {
        budgetCard.classList.add('loading');
    }
    
    // Get budget data from Firebase
    firebase.database().ref('budgets/' + uid + '/current')
        .once('value')
        .then(snapshot => {
            const budgetData = snapshot.val();
            
            if (budgetData) {
                // Use budget data from Firebase
                updateBudgetUI(budgetData);
            } else {
                // Set default budget data
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                
                const defaultBudget = {
                    limit: 3000,
                    spent: 0, // Start with zero spent
                    period: 'monthly',
                    startDate: firstDay.toISOString().split('T')[0],
                    endDate: lastDay.toISOString().split('T')[0],
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };
                
                // Save default budget to Firebase
                firebase.database().ref('budgets/' + uid + '/current').set(defaultBudget)
                    .then(() => {
                        console.log('Default budget saved to Firebase');
                        updateBudgetUI(defaultBudget);
                    })
                    .catch(error => {
                        console.error('Error saving default budget:', error);
                    });
            }
            
            // Remove loading state
            if (budgetCard) {
                budgetCard.classList.remove('loading');
            }
        })
        .catch(error => {
            console.error('Error fetching budget data:', error);
            
            // Remove loading state
            if (budgetCard) {
                budgetCard.classList.remove('loading');
            }
        });
        
    // Calculate actual spent amount from milk records
    calculateMonthlySpending(uid)
    
    // Set up budget button click event
    document.getElementById('setBudgetBtn').addEventListener('click', function() {
        // Show budget modal
        const setBudgetModal = document.getElementById('setBudgetGoalModal');
        if (setBudgetModal) {
            // Update modal title and labels
            const modalTitle = setBudgetModal.querySelector('.modal-header h2');
            if (modalTitle) modalTitle.textContent = 'Set Monthly Budget';
            
            const amountLabel = setBudgetModal.querySelector('label[for="goalAmount"]');
            if (amountLabel) amountLabel.textContent = 'Budget Amount (₹)';
            
            const user = firebase.auth().currentUser;
            if (!user) return;
            
            // Get current budget data from Firebase
            firebase.database().ref('budgets/' + user.uid + '/current')
                .once('value')
                .then(snapshot => {
                    const budgetData = snapshot.val() || { limit: 3000 };
                    
                    // Set current values in form
                    document.getElementById('goalAmount').value = budgetData.limit;
                    
                    // Set dates from current budget or defaults
                    const today = new Date();
                    const firstDay = budgetData.startDate ? new Date(budgetData.startDate) : 
                        new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastDay = budgetData.endDate ? new Date(budgetData.endDate) : 
                        new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    
                    document.getElementById('goalStartDate').valueAsDate = firstDay;
                    document.getElementById('goalEndDate').valueAsDate = lastDay;
                    document.getElementById('goalPeriod').value = budgetData.period || 'monthly';
                    
                    // Show the modal
                    setBudgetModal.classList.add('active');
                })
                .catch(error => {
                    console.error('Error fetching budget data:', error);
                    showToast('Error loading budget data. Please try again.');
                });
        }
    });
    
    // Handle budget form submission
    const setBudgetForm = document.getElementById('setBudgetGoalForm');
    if (setBudgetForm) {
        setBudgetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = firebase.auth().currentUser;
            if (!user) {
                showToast('You must be logged in to set a budget');
                return;
            }
            
            // Show loading state
            const submitBtn = setBudgetForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }
            
            const budgetData = {
                limit: parseFloat(document.getElementById('goalAmount').value),
                period: document.getElementById('goalPeriod').value,
                startDate: document.getElementById('goalStartDate').value,
                endDate: document.getElementById('goalEndDate').value,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Save to Firebase
            firebase.database().ref('budgets/' + user.uid + '/current')
                .update(budgetData)
                .then(() => {
                    console.log('Budget updated in Firebase');
                    
                    // Recalculate spending based on actual records
                    calculateMonthlySpending(user.uid);
                    
                    // Close modal
                    const setBudgetModal = document.getElementById('setBudgetGoalModal');
                    if (setBudgetModal) setBudgetModal.classList.remove('active');
                    
                    // Show success message
                    showToast('Budget updated successfully');
                })
                .catch(error => {
                    console.error('Error updating budget:', error);
                    showToast('Error saving budget. Please try again.');
                })
                .finally(() => {
                    // Reset button state
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Save Budget';
                    }
                });
        });
    }
}

// Update budget UI
function updateBudgetUI(budgetData) {
    const budgetProgress = document.getElementById('budgetProgress');
    const budgetIndicator = document.getElementById('budgetIndicator');
    const budgetCard = document.querySelector('.budget-card');
    
    // Ensure spent and limit are numbers
    const spent = parseFloat(budgetData.spent) || 0;
    const limit = parseFloat(budgetData.limit) || 1; // Prevent division by zero
    
    // Calculate percentage of budget used
    const percentUsed = (spent / limit) * 100;
    const percentFormatted = percentUsed.toFixed(1);
    
    // Update progress bar width
    if (budgetProgress) {
        budgetProgress.style.width = `${Math.min(percentUsed, 100)}%`;
    }
    
    // Update budget values
    const spentValue = document.querySelector('.budget-spent .budget-value');
    const limitValue = document.querySelector('.budget-limit .budget-value');
    
    if (spentValue) spentValue.textContent = `₹${spent.toLocaleString()}`;
    if (limitValue) limitValue.textContent = `₹${limit.toLocaleString()}`;
    
    // Update percentage display
    const percentageValue = document.querySelector('.percentage-value');
    if (percentageValue) {
        percentageValue.textContent = `${percentFormatted}%`;
    }
    
    // Update budget status
    const statusIcon = document.querySelector('.status-icon i');
    const statusText = document.querySelector('.status-text');
    
    // Remove existing state classes
    if (budgetCard) {
        budgetCard.classList.remove('budget-warning', 'budget-danger');
    }
    
    // Set appropriate status based on percentage used
    if (percentUsed < 70) {
        // Good - under 70%
        if (statusIcon) statusIcon.className = 'fas fa-check-circle';
        if (statusText) statusText.textContent = 'You\'re on track with your monthly budget';
    } else if (percentUsed < 90) {
        // Warning - between 70% and 90%
        if (budgetCard) budgetCard.classList.add('budget-warning');
        if (statusIcon) statusIcon.className = 'fas fa-exclamation-circle';
        if (statusText) statusText.textContent = 'You\'ve used over 70% of your monthly budget';
    } else {
        // Danger - over 90%
        if (budgetCard) budgetCard.classList.add('budget-danger');
        if (statusIcon) statusIcon.className = 'fas fa-exclamation-triangle';
        if (statusText) statusText.textContent = 'You\'re approaching your monthly budget limit';
    }
    
    // Update date range
    const startDate = new Date(budgetData.startDate);
    const endDate = new Date(budgetData.endDate);
    
    const dateRange = `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getDate()}-${endDate.getDate()}, ${endDate.getFullYear()}`;
    const budgetDate = document.querySelector('.budget-date');
    if (budgetDate) budgetDate.textContent = dateRange;
}

// Calculate monthly spending from milk records
function calculateMonthlySpending(uid) {
    // Get current month's date range
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const firstDayFormatted = firstDay.toISOString().split('T')[0];
    const lastDayFormatted = lastDay.toISOString().split('T')[0];
    
    // Fetch milk records for current month
    firebase.database().ref('milkRecords')
        .child(uid)
        .orderByChild('date')
        .startAt(firstDayFormatted)
        .endAt(lastDayFormatted)
        .once('value')
        .then(snapshot => {
            let totalSpent = 0;
            
            snapshot.forEach(childSnapshot => {
                const record = childSnapshot.val();
                totalSpent += parseFloat(record.price) || 0;
            });
            
            // Update the budget with actual spending
            firebase.database().ref('budgets/' + uid + '/current')
                .update({ spent: totalSpent })
                .then(() => {
                    console.log('Budget spending updated with actual records');
                })
                .catch(error => {
                    console.error('Error updating budget spending:', error);
                });
        })
        .catch(error => {
            console.error('Error calculating monthly spending:', error);
        });
}


// Setup notes functionality
function setupNotes() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Set up add note button
    const addNoteBtn = document.querySelector('.add-note-btn');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', function() {
            const addNoteModal = document.getElementById('addNoteModal');
            if (addNoteModal) {
                // Set default date to today
                document.getElementById('noteDate').valueAsDate = new Date();
                document.getElementById('noteContent').value = '';
                
                // Show the modal
                addNoteModal.classList.add('active');
            }
        });
    }
    
    // Handle note form submission
    const addNoteForm = document.getElementById('addNoteForm');
    if (addNoteForm) {
        addNoteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = firebase.auth().currentUser;
            if (!user) {
                showToast('You must be logged in to add notes');
                return;
            }
            
            // Show loading state
            const submitBtn = addNoteForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }
            
            const noteData = {
                date: document.getElementById('noteDate').value,
                content: document.getElementById('noteContent').value,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Save to Firebase
            const newNoteRef = firebase.database().ref('notes/' + user.uid).push();
            newNoteRef.set(noteData)
                .then(() => {
                    console.log('Note added to Firebase');
                    
                    // Close modal
                    const addNoteModal = document.getElementById('addNoteModal');
                    if (addNoteModal) addNoteModal.classList.remove('active');
                    
                    // Show success message
                    showToast('Note added successfully');
                    
                    // Update UI
                    updateNotesUI();
                })
                .catch(error => {
                    console.error('Error adding note:', error);
                    showToast('Error saving note. Please try again.');
                })
                .finally(() => {
                    // Reset button state
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Save Note';
                    }
                });
        });
    }
    
    // Set up cancel buttons
    document.getElementById('cancelNoteBtn')?.addEventListener('click', function() {
        const addNoteModal = document.getElementById('addNoteModal');
        if (addNoteModal) addNoteModal.classList.remove('active');
    });
    
    // Load notes from Firebase
    updateNotesUI();
}

// Update notes UI
function updateNotesUI() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const notesContainer = document.querySelector('.notes-container');
    if (!notesContainer) return;
    
    // Show loading state
    notesContainer.innerHTML = '<div class="loading-notes"><i class="fas fa-spinner fa-spin"></i> Loading notes...</div>';
    
    // Fetch notes from Firebase
    firebase.database().ref('notes/' + user.uid)
        .orderByChild('date')
        .limitToLast(5) // Limit to most recent 5 notes
        .once('value')
        .then(snapshot => {
            // Clear existing notes
            notesContainer.innerHTML = '';
            
            if (!snapshot.exists()) {
                // Add placeholder if no notes
                notesContainer.innerHTML = '<div class="note-item empty-note">No notes yet. Click "Add Note" to create one.</div>';
                return;
            }
            
            // Convert snapshot to array and sort by date (newest first)
            const notes = [];
            snapshot.forEach(childSnapshot => {
                notes.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            notes.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Add notes to UI
            notes.forEach(note => {
                const noteDate = new Date(note.date);
                const formattedDate = noteDate.toLocaleString('default', { month: 'short', day: 'numeric' });
                
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                noteItem.dataset.id = note.id;
                
                noteItem.innerHTML = `
                    <div class="note-date">${formattedDate}</div>
                    <div class="note-content">${note.content}</div>
                    <button class="delete-note-btn" onclick="deleteNote('${note.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                notesContainer.appendChild(noteItem);
            });
        })
        .catch(error => {
            console.error('Error fetching notes:', error);
            notesContainer.innerHTML = '<div class="note-item error-note">Error loading notes. Please try again.</div>';
        });
}

// Delete note function (global so it can be called from onclick)
function deleteNote(noteId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('You must be logged in to delete notes');
        return;
    }
    
    // Confirm deletion
    if (confirm('Are you sure you want to delete this note?')) {
        firebase.database().ref('notes/' + user.uid + '/' + noteId).remove()
            .then(() => {
                console.log('Note deleted from Firebase');
                showToast('Note deleted successfully');
                updateNotesUI();
            })
            .catch(error => {
                console.error('Error deleting note:', error);
                showToast('Error deleting note. Please try again.');
            });
    }
}

// Show toast message
function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// Fetch data for the trend chart
function fetchDataForTrendChart(uid) {
    const trendCtx = document.getElementById('trendChart');
    if (!trendCtx) return;

    // Get current date
    const today = new Date();
    
    // Determine selected period (default to 'week')
    const activePeriodBtn = document.querySelector('.chart-period-btn.active[data-period]');
    const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : 'week';
    
    let startDate, endDate;
    let labels = [];
    
    // Set date range based on period
    if (period === 'week') {
        // Last 7 days
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6); // 7 days including today
        
        // Create labels for the last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
    } else if (period === 'month') {
        // Last 30 days
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 29); // 30 days including today
        
        // Create labels for the last 30 days (show every 3rd day for clarity)
        for (let i = 0; i < 30; i += 3) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            labels.push(date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
        }
        // Always add the last day
        labels.push(endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
    } else { // year
        // Last 12 months
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 11); // 12 months including current month
        startDate.setDate(1); // Start from the 1st of the month
        
        // Create labels for the last 12 months
        for (let i = 0; i < 12; i++) {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + i);
            labels.push(date.toISOString().split('T')[0].split('-')[1]);
        }
    }
    
    // Format dates for database query
    const startDateFormatted = startDate.toISOString().split('T')[0];
    const endDateFormatted = endDate.toISOString().split('T')[0];
    
    // Fetch milk records
    firebase.database().ref('milkRecords')
        .child(uid)
        .orderByChild('date')
        .startAt(startDateFormatted)
        .endAt(endDateFormatted)
        .once('value')
        .then(snapshot => {
            // Initialize data objects
            const dataByDate = {};
            
            // Initialize with zeros for each date in the range
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateKey = currentDate.toISOString().split('T')[0];
                dataByDate[dateKey] = { quantity: 0, price: 0 };
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Fill in actual data from database
            snapshot.forEach(childSnapshot => {
                const record = childSnapshot.val();
                const recordDate = record.date;
                
                if (dataByDate[recordDate]) {
                    dataByDate[recordDate].quantity += parseFloat(record.quantity) || 0;
                    dataByDate[recordDate].price += parseFloat(record.price) || 0;
                }
            });
            
            // Prepare chart data
            const quantityData = [];
            const priceData = [];
            
            // Group data according to the selected period
            if (period === 'week') {
                // Daily data for week view
                for (let i = 0; i < 7; i++) {
                    const date = new Date(startDate);
                    date.setDate(date.getDate() + i);
                    const dateKey = date.toISOString().split('T')[0];
                    
                    quantityData.push(dataByDate[dateKey]?.quantity || 0);
                    priceData.push(dataByDate[dateKey]?.price || 0);
                }
            } else if (period === 'month') {
                // Group data every 3 days for month view to match labels
                for (let i = 0; i < 30; i += 3) {
                    let totalQuantity = 0;
                    let totalPrice = 0;
                    
                    // Sum 3 days
                    for (let j = 0; j < 3 && (i + j) < 30; j++) {
                        const date = new Date(startDate);
                        date.setDate(date.getDate() + i + j);
                        const dateKey = date.toISOString().split('T')[0];
                        
                        totalQuantity += dataByDate[dateKey]?.quantity || 0;
                        totalPrice += dataByDate[dateKey]?.price || 0;
                    }
                    
                    quantityData.push(totalQuantity);
                    priceData.push(totalPrice);
                }
                
                // Add the last day if not already included
                if (labels.length > quantityData.length) {
                    const lastDate = endDate.toISOString().split('T')[0];
                    quantityData.push(dataByDate[lastDate]?.quantity || 0);
                    priceData.push(dataByDate[lastDate]?.price || 0);
                }
            } else { // year
                // Monthly data for year view
                for (let i = 0; i < 12; i++) {
                    let totalQuantity = 0;
                    let totalPrice = 0;
                    
                    const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                    const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0);
                    
                    // Iterate through all days in the month
                    let currentDate = new Date(monthStart);
                    while (currentDate <= monthEnd && currentDate <= endDate) {
                        const dateKey = currentDate.toISOString().split('T')[0];
                        
                        totalQuantity += dataByDate[dateKey]?.quantity || 0;
                        totalPrice += dataByDate[dateKey]?.price || 0;
                        
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    
                    quantityData.push(totalQuantity);
                    priceData.push(totalPrice);
                }
            }
            
            // Create the chart
            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Milk (L)',
                            data: quantityData,
                            borderColor: '#00BFA6',
                            backgroundColor: 'rgba(0, 191, 166, 0.1)',
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Price (₹)',
                            data: priceData,
                            borderColor: '#FF6B6B',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Liters'
                            }
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false
                            },
                            title: {
                                display: true,
                                text: 'Price (₹)'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error("Error fetching trend chart data:", error);
            
            // Create an empty chart as fallback
            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Milk (L)',
                            data: Array(labels.length).fill(0),
                            borderColor: '#00BFA6',
                            backgroundColor: 'rgba(0, 191, 166, 0.1)',
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Price (₹)',
                            data: Array(labels.length).fill(0),
                            borderColor: '#FF6B6B',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Liters'
                            }
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false
                            },
                            title: {
                                display: true,
                                text: 'Price (₹)'
                            }
                        }
                    }
                }
            });
        });
}

// Update charts based on selected period
function updateChartsForPeriod(period) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    fetchDataForTrendChart(user.uid);
    fetchDataForSourceChart(user.uid);
}

// Fetch data for expense distribution chart
function fetchDataForExpenseChart(uid) {
    const expenseCtx = document.getElementById('expenseChart');
    if (!expenseCtx) return;

    // Get current date
    const today = new Date();
    
    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayFormatted = firstDayOfMonth.toISOString().split('T')[0];
    
    // Get last day of current month
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const lastDayFormatted = lastDayOfMonth.toISOString().split('T')[0];

    // Determine distribution type (source or type)
    const activeTypeBtn = document.querySelector('.chart-type-btn.active[data-type]');
    const distributionType = activeTypeBtn ? activeTypeBtn.getAttribute('data-type') : 'source';
    
    // Fetch milk records for current month
    firebase.database().ref('milkRecords')
        .child(uid)
        .orderByChild('date')
        .startAt(firstDayFormatted)
        .endAt(lastDayFormatted)
        .once('value')
        .then(snapshot => {
            // For source distribution
            const expenseBySource = {};
            
            // For type distribution (regular vs extra)
            const expenseByType = {
                'Regular': 0,
                'Extra': 0
            };
            
            // Calculate expenses
            snapshot.forEach(childSnapshot => {
                const record = childSnapshot.val();
                const price = parseFloat(record.price) || 0;
                const source = record.source || 'Unknown';
                const isExtra = record.isExtra === true;
                
                // Update source distribution
                if (!expenseBySource[source]) {
                    expenseBySource[source] = 0;
                }
                expenseBySource[source] += price;
                
                // Update type distribution
                if (isExtra) {
                    expenseByType['Extra'] += price;
                } else {
                    expenseByType['Regular'] += price;
                }
            });
            
            let chartData = {
                labels: [],
                values: []
            };
            
            if (distributionType === 'source') {
                // Sort sources by expense (highest first)
                const sortedSources = Object.entries(expenseBySource)
                    .sort((a, b) => b[1] - a[1]);
                
                // Use top 5 sources, group others if more than 5
                if (sortedSources.length > 5) {
                    const top5 = sortedSources.slice(0, 5);
                    const others = sortedSources.slice(5);
                    
                    chartData.labels = top5.map(([source]) => source);
                    chartData.values = top5.map(([, expense]) => expense);
                    
                    // Add "Others" category
                    const othersTotal = others.reduce((sum, [, expense]) => sum + expense, 0);
                    chartData.labels.push('Others');
                    chartData.values.push(othersTotal);
                } else {
                    chartData.labels = sortedSources.map(([source]) => source);
                    chartData.values = sortedSources.map(([, expense]) => expense);
                }
            } else { // type
                chartData.labels = Object.keys(expenseByType);
                chartData.values = Object.values(expenseByType);
            }
            
            // Create chart
            new Chart(expenseCtx, {
                type: 'doughnut',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        data: chartData.values,
                        backgroundColor: [
                            '#4D96FF',
                            '#FFC93C',
                            '#FF6B6B',
                            '#00BFA6',
                            '#9C27B0',
                            '#607D8B'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    cutout: '70%'
                }
            });
        })
        .catch(error => {
            console.error("Error fetching expense chart data:", error);
            
            // Create empty chart as fallback
            new Chart(expenseCtx, {
                type: 'doughnut',
                data: {
                    labels: ['No Data Available'],
                    datasets: [{
                        data: [100],
                        backgroundColor: ['#607D8B'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    cutout: '70%'
                }
            });
        });
}

// Update expense chart based on selected type
function updateExpenseChartByType(type) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    fetchDataForExpenseChart(user.uid);
}

// Fetch data for source chart
function fetchDataForSourceChart(uid) {
    const sourceCtx = document.getElementById('sourceChart');
    if (!sourceCtx) return;

    // Get current date
    const today = new Date();
    
    // Determine selected period (default to 'week')
    const activePeriodBtn = document.querySelector('.chart-actions .chart-period-btn.active[data-period]');
    const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : 'week';
    
    let startDate, endDate;
    
    // Set date range based on period
    if (period === 'week') {
        // Last 7 days
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6); // 7 days including today
    } else { // month
        // Current month
        endDate = new Date(today);
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    // Format dates for database query
    const startDateFormatted = startDate.toISOString().split('T')[0];
    const endDateFormatted = endDate.toISOString().split('T')[0];
    
    // Fetch milk records
    firebase.database().ref('milkRecords')
        .child(uid)
        .orderByChild('date')
        .startAt(startDateFormatted)
        .endAt(endDateFormatted)
        .once('value')
        .then(snapshot => {
            const quantityBySource = {};
            
            // Calculate milk quantity by source
            snapshot.forEach(childSnapshot => {
                const record = childSnapshot.val();
                const quantity = parseFloat(record.quantity) || 0;
                const source = record.source || 'Unknown';
                
                if (!quantityBySource[source]) {
                    quantityBySource[source] = 0;
                }
                quantityBySource[source] += quantity;
            });
            
            // Sort sources by quantity (highest first)
            const sortedSources = Object.entries(quantityBySource)
                .sort((a, b) => b[1] - a[1]);
            
            const labels = sortedSources.map(([source]) => source);
            const values = sortedSources.map(([, quantity]) => quantity);
            
            // Create chart
            new Chart(sourceCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Liters',
                        data: values,
                        backgroundColor: '#4D96FF',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Liters'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error("Error fetching source chart data:", error);
            
            // Create empty chart as fallback
            new Chart(sourceCtx, {
                type: 'bar',
                data: {
                    labels: ['No Data Available'],
                    datasets: [{
                        label: 'Liters',
                        data: [0],
                        backgroundColor: '#4D96FF',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Liters'
                            }
                        }
                    }
                }
            });
        });
}

// Fetch data for frequency chart (daily vs occasional)
function fetchDataForFrequencyChart(uid) {
    const frequencyCtx = document.getElementById('frequencyChart');
    if (!frequencyCtx) return;

    // Get current month range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayFormatted = firstDayOfMonth.toISOString().split('T')[0];
    
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const lastDayFormatted = lastDayOfMonth.toISOString().split('T')[0];
    
    // First fetch all sources
    firebase.database().ref('sources')
        .child(uid)
        .once('value')
        .then(sourcesSnapshot => {
            const sourceTypes = {};
            
            // Categorize sources as daily or occasional
            sourcesSnapshot.forEach(childSnapshot => {
                const source = childSnapshot.val();
                const sourceName = source.name;
                const frequency = source.frequency || 'occasional';
                
                sourceTypes[sourceName] = frequency === 'daily' ? 'daily' : 'occasional';
            });
            
            // Now fetch milk records
            firebase.database().ref('milkRecords')
                .child(uid)
                .orderByChild('date')
                .startAt(firstDayFormatted)
                .endAt(lastDayFormatted)
                .once('value')
                .then(recordsSnapshot => {
                    let dailyQuantity = 0;
                    let occasionalQuantity = 0;
                    
                    // Calculate quantities by source type
                    recordsSnapshot.forEach(childSnapshot => {
                        const record = childSnapshot.val();
                        const sourceName = record.source;
                        const quantity = parseFloat(record.quantity) || 0;
                        
                        // Use the source type if we know it, otherwise default to occasional
                        const sourceType = sourceTypes[sourceName] || 'occasional';
                        
                        if (sourceType === 'daily') {
                            dailyQuantity += quantity;
                        } else {
                            occasionalQuantity += quantity;
                        }
                    });
                    
                    // Create chart
                    new Chart(frequencyCtx, {
                        type: 'pie',
                        data: {
                            labels: ['Daily', 'Occasional'],
                            datasets: [{
                                data: [dailyQuantity, occasionalQuantity],
                                backgroundColor: [
                                    '#00BFA6', // daily
                                    '#FFC93C'  // occasional
                                ],
                                borderWidth: 0
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error("Error fetching frequency chart records data:", error);
                    createEmptyFrequencyChart();
                });
        })
        .catch(error => {
            console.error("Error fetching frequency chart sources data:", error);
            createEmptyFrequencyChart();
        });
}

// Create an empty frequency chart
function createEmptyFrequencyChart() {
    const frequencyCtx = document.getElementById('frequencyChart');
    if (!frequencyCtx) return;
    
    new Chart(frequencyCtx, {
        type: 'pie',
        data: {
            labels: ['No Data Available'],
            datasets: [{
                data: [100],
                backgroundColor: ['#607D8B'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
