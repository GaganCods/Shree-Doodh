// DOM Elements
const addNewRecordBtn = document.getElementById('addNewRecordBtn');
const addExtraMilkBtn = document.getElementById('addExtraMilkBtn');
const editAutoUpdateBtn = document.getElementById('editAutoUpdateBtn');
const recordsTableBody = document.getElementById('recordsTableBody');
const autoUpdateSourcesList = document.getElementById('autoUpdateSourcesList');

// Modals
const addRecordModal = document.getElementById('addRecordModal');
const addExtraMilkModal = document.getElementById('addExtraMilkModal');
const editAutoUpdateModal = document.getElementById('editAutoUpdateModal');

// Forms
const addRecordForm = document.getElementById('addRecordForm');
const addExtraMilkForm = document.getElementById('addExtraMilkForm');

// Initialize Firebase References
const milkRecordsRef = firebase.database().ref('milkRecords');
const sourcesRef = firebase.database().ref('sources');
const autoUpdateSourcesRef = firebase.database().ref('autoUpdateSources');

// Current User
let currentUser = null;

// Pagination
let currentPage = 1;
const recordsPerPage = 10;
let totalRecords = 0;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Check Authentication
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            initializePage();
        } else {
            window.location.href = '../auth/login.html';
        }
    });
    
    // Apply dark mode state
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        if (document.getElementById('darkModeToggle')) {
            document.getElementById('darkModeToggle').checked = true;
        }
    }
});

// Initialize Page
function initializePage() {
    loadMilkRecords();
    loadSources();
    loadAutoUpdateSources();
    setupEventListeners();
    initializeFilters();
}

// Load Milk Records
function loadMilkRecords(filters = {}) {
    try {
        if (!currentUser || !currentUser.uid) {
            console.error('No user ID available for fetching records');
            showEmptyStateMessage('No user is logged in. Please log in to view your milk records.');
            return;
        }

        showLoadingState('Loading your milk records...');
        
        let query = milkRecordsRef.child(currentUser.uid);
        
        // Apply filters
        if (filters.startDate && filters.endDate) {
            query = query.orderByChild('date')
                .startAt(filters.startDate)
                .endAt(filters.endDate);
        } else {
            query = query.orderByChild('date');
        }
        
        query.once('value')
            .then((snapshot) => {
                let records = [];
                snapshot.forEach((childSnapshot) => {
                    records.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                // Apply source filter if present
                if (filters.source && filters.source !== 'all') {
                    records = records.filter(record => record.source === filters.source);
                }
                
                // Sort records by date (newest first)
                records.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                totalRecords = records.length;
                updatePagination();
                
                if (records.length === 0) {
                    showEmptyStateMessage('No milk records found. Add your first record!');
                } else {
                    displayRecords(records);
                    updateSummary(records);
                }
            })
            .catch((error) => {
                console.error('Error loading records:', error);
                showNotification('Error loading records: ' + error.message, 'error');
                showEmptyStateMessage('Failed to load records. Please try again later.');
            });
    } catch (error) {
        console.error('Exception in loadMilkRecords:', error);
        showNotification('Error loading records: ' + error.message, 'error');
        showEmptyStateMessage('Error occurred while fetching records.');
    }
}

// Show loading state while data is being fetched
function showLoadingState(message) {
    if (recordsTableBody) {
        recordsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>${message || 'Loading...'}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Show empty state message when no records are found
function showEmptyStateMessage(message) {
    if (recordsTableBody) {
        recordsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-wine-bottle empty-icon"></i>
                        <p>${message}</p>
                        <button class="btn btn-primary" onclick="document.getElementById('addRecordModal').classList.add('active')">
                            <i class="fas fa-plus"></i> Add New Record
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Also update summary to show zeros
    updateSummary([]);
}

// Load Sources
function loadSources() {
    try {
        if (!currentUser || !currentUser.uid) {
            console.error('No user ID available for fetching sources');
            return;
        }

        sourcesRef.child(currentUser.uid).once('value')
            .then((snapshot) => {
                // Populate source dropdown
                const sourceDropdown = document.getElementById('recordSource');
                const extraMilkSourceDropdown = document.getElementById('extraMilkSource');
                const sourceFilter = document.getElementById('sourceFilter');
                
                if (sourceDropdown) {
                    // Clear existing options except the first two (default and manual)
                    while (sourceDropdown.options.length > 2) {
                        sourceDropdown.remove(2);
                    }
                    
                    let sourceCount = 0;
                    snapshot.forEach((childSnapshot) => {
                        sourceCount++;
                        const source = childSnapshot.val();
                        const option = document.createElement('option');
                        option.value = source.name;
                        option.textContent = source.name;
                        sourceDropdown.appendChild(option);
                    });
                    
                    if (sourceCount === 0) {
                        // Add a redirect option if no sources are found
                        const option = document.createElement('option');
                        option.value = "no_sources";
                        option.textContent = "No sources found - Add one first";
                        sourceDropdown.appendChild(option);
                        
                        sourceDropdown.addEventListener('change', function() {
                            if (this.value === "no_sources") {
                                window.location.href = 'sources-pricing.html';
                            }
                        });
                    }
                }
                
                if (extraMilkSourceDropdown) {
                    // Clear existing options except the first one (default)
                    while (extraMilkSourceDropdown.options.length > 1) {
                        extraMilkSourceDropdown.remove(1);
                    }
                    
                    snapshot.forEach((childSnapshot) => {
                        const source = childSnapshot.val();
                        const option = document.createElement('option');
                        option.value = source.name;
                        option.textContent = source.name;
                        extraMilkSourceDropdown.appendChild(option);
                    });
                }
                
                if (sourceFilter) {
                    // Clear existing options except the first one (All Sources)
                    while (sourceFilter.options.length > 1) {
                        sourceFilter.remove(1);
                    }
                    
                    snapshot.forEach((childSnapshot) => {
                        const source = childSnapshot.val();
                        const option = document.createElement('option');
                        option.value = source.name;
                        option.textContent = source.name;
                        sourceFilter.appendChild(option);
                    });
                }
            })
            .catch((error) => {
                console.error('Error loading sources:', error);
                showNotification('Error loading sources: ' + error.message, 'error');
            });
    } catch (error) {
        console.error('Exception in loadSources:', error);
    }
}

// Display Records
function displayRecords(records) {
    if (!recordsTableBody) {
        console.error('Records table body element not found');
        return;
    }
    
    if (records.length === 0) {
        showEmptyStateMessage('No records found for the selected filter criteria.');
        return;
    }
    
    // Clear the table body
    recordsTableBody.innerHTML = '';
    
    // Start and end index for current page
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, records.length);
    
    // If no records within the page range, show empty state
    if (startIndex >= records.length) {
        showEmptyStateMessage('No more records to display.');
        return;
    }
    
    // Display the subset of records for the current page
    for (let i = startIndex; i < endIndex; i++) {
        const record = records[i];
        const row = document.createElement('tr');
        
        // Format date for display
        const displayDate = formatDate(record.date);
        
        // Calculate total
        const total = (record.quantity * record.price).toFixed(2);
        
        row.innerHTML = `
            <td>${displayDate}</td>
            <td>${record.source || 'Unknown'}</td>
            <td class="text-center">${record.quantity} L</td>
            <td class="text-center">₹${record.price}</td>
            <td class="text-center">₹${total}</td>
            <td class="text-center">${record.note || '-'}</td>
            <td class="actions">
                <button class="edit-btn" data-id="${record.id}" aria-label="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${record.id}" aria-label="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        // Add row to table
        recordsTableBody.appendChild(row);
        
        // Add event listeners to the buttons
        row.querySelector('.edit-btn').addEventListener('click', function() {
            // Edit record logic
            editRecord(record);
        });
        
        row.querySelector('.delete-btn').addEventListener('click', function() {
            // Delete record logic
            deleteRecord(record.id);
        });
    }
}

// Update Summary
function updateSummary(records) {
    const totalRecordsCount = document.getElementById('totalRecordsCount');
    const totalQuantity = document.getElementById('totalQuantity');
    const totalExpense = document.getElementById('totalExpense');
    const avgPricePerLiter = document.getElementById('avgPricePerLiter');
    
    if (!totalRecordsCount || !totalQuantity || !totalExpense || !avgPricePerLiter) {
        console.error('One or more summary elements not found');
        return;
    }
    
    const recordsCount = records.length;
    let totalQty = 0;
    let totalExp = 0;
    
    records.forEach(record => {
        totalQty += record.quantity;
        totalExp += record.quantity * record.price;
    });
    
    const avgPrice = totalQty > 0 ? totalExp / totalQty : 0;
    
    totalRecordsCount.textContent = recordsCount;
    totalQuantity.textContent = `${totalQty.toFixed(1)} L`;
    totalExpense.textContent = `₹${totalExp.toFixed(2)}`;
    avgPricePerLiter.textContent = `₹${avgPrice.toFixed(2)}`;
}

// Add New Record
function addNewRecord(event) {
    event.preventDefault();
    
    const date = document.getElementById('recordDate').value;
    let source = document.getElementById('recordSource').value;
    
    if (source === 'manual') {
        source = document.getElementById('manualSource').value;
        if (!source) {
            showNotification('Please enter a source name', 'error');
            return;
        }
    }
    
    const contact = document.getElementById('recordContact').value;
    const quantity = parseFloat(document.getElementById('recordQuantity').value);
    const price = parseFloat(document.getElementById('recordPrice').value);
    const note = document.getElementById('recordNote').value;
    const markAsDaily = document.getElementById('markAsDaily').checked;
    
    if (!date || !source || !quantity || !price) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const recordData = {
        date,
        source,
        quantity,
        price,
        note,
        timestamp: Date.now()
    };
    
    console.log('Adding new record:', recordData);
    showNotification('Record added successfully! (Mock)', 'success');
    closeModal(addRecordModal);
    
    // In a real app, you'd save to Firebase here
    // For this demo, we'll just add it to our mock data
    const mockRecord = {
        id: 'new' + Date.now(),
        ...recordData
    };
    
    // Clear the form
    addRecordForm.reset();
    
    // Reload records (in real app, you'd add the new record to the database)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('recordDate').value = today;
    
    // Refresh the records display with our new record
    loadMilkRecords();
}

// Add Extra Milk
function addExtraMilk(event) {
    event.preventDefault();
    
    const date = document.getElementById('extraMilkDate').value;
    const source = document.getElementById('extraMilkSource').value;
    const quantity = parseFloat(document.getElementById('extraMilkQuantity').value);
    const note = document.getElementById('extraMilkNote').value;
    
    if (!date || !source || !quantity || !note) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    console.log('Adding extra milk:', { date, source, quantity, note });
    showNotification('Extra milk added successfully! (Mock)', 'success');
    closeModal(addExtraMilkModal);
    
    // In a real app, you'd save to Firebase here
    // For this demo, we'll just pretend it worked
    
    // Clear the form
    addExtraMilkForm.reset();
    
    // Set the date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('extraMilkDate').value = today;
    
    // Refresh the records
    loadMilkRecords();
}

// Load Auto-Update Sources
function loadAutoUpdateSources() {
    // For demo purposes, let's create mock auto-update sources
    console.log('Using mock auto-update sources for development/testing');
    
    const mockAutoUpdateSources = [
        {
            id: 'auto1',
            name: 'Sharma Dairy',
            quantity: 2.5,
            price: 50
        },
        {
            id: 'auto2',
            name: 'Gupta Milk',
            quantity: 2.0,
            price: 48
        }
    ];
    
    autoUpdateSourcesList.innerHTML = '';
    
    mockAutoUpdateSources.forEach(source => {
        const sourceElement = createAutoUpdateSourceElement(source);
        autoUpdateSourcesList.appendChild(sourceElement);
    });
}

function createAutoUpdateSourceElement(source) {
    const div = document.createElement('div');
    div.className = 'auto-update-item';
    div.innerHTML = `
        <div class="auto-update-info">
            <h4>${source.name}</h4>
            <div class="auto-update-details">
                ${source.quantity}L at ₹${source.price}/L
            </div>
        </div>
        <button class="action-icon" onclick="removeAutoUpdateSource('${source.id}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    return div;
}

// Utility Functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function showNotification(message, type) {
    // Implement your notification system here
    console.log(`${type}: ${message}`);
    alert(message);
}

function closeModal(modal) {
    modal.style.display = 'none';
}

// Event Listeners
function setupEventListeners() {
    // Add Record Modal
    addNewRecordBtn.addEventListener('click', () => {
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('recordDate').value = today;
        
        // Reset the form
        addRecordForm.reset();
        document.getElementById('recordDate').value = today;
        
        // Show the modal
        addRecordModal.style.display = 'flex';
    });
    
    // Add Extra Milk Modal
    addExtraMilkBtn.addEventListener('click', () => {
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('extraMilkDate').value = today;
        
        // Reset the form
        addExtraMilkForm.reset();
        document.getElementById('extraMilkDate').value = today;
        
        // Show the modal
        addExtraMilkModal.style.display = 'flex';
    });
    
    // Form Submissions
    addRecordForm.addEventListener('submit', addNewRecord);
    addExtraMilkForm.addEventListener('submit', addExtraMilk);
    
    // Close Modals
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });
    
    // Cancel Buttons
    document.getElementById('cancelRecordBtn').addEventListener('click', () => {
        closeModal(addRecordModal);
    });
    
    document.getElementById('cancelExtraMilkBtn').addEventListener('click', () => {
        closeModal(addExtraMilkModal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // Source Selection
    document.getElementById('recordSource').addEventListener('change', (e) => {
        const manualSourceGroup = document.getElementById('manualSourceGroup');
        manualSourceGroup.style.display = e.target.value === 'manual' ? 'block' : 'none';
    });
    
    // Auto Calculate Total Price
    document.getElementById('recordQuantity').addEventListener('input', calculateTotal);
    document.getElementById('recordPrice').addEventListener('input', calculateTotal);
    
    // Edit Auto-Update Sources
    editAutoUpdateBtn.addEventListener('click', () => {
        editAutoUpdateModal.style.display = 'flex';
    });
    
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            toggleDarkMode(this.checked);
        });
    }
}

function calculateTotal() {
    const quantity = parseFloat(document.getElementById('recordQuantity').value) || 0;
    const price = parseFloat(document.getElementById('recordPrice').value) || 0;
    document.getElementById('recordTotal').value = (quantity * price).toFixed(2);
}

// Initialize Filters
function initializeFilters() {
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    const customDateRange = document.getElementById('customDateRange');
    const sourceFilter = document.getElementById('sourceFilter');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    
    dateRangeFilter.addEventListener('change', () => {
        customDateRange.style.display = dateRangeFilter.value === 'custom' ? 'flex' : 'none';
    });
    
    applyFiltersBtn.addEventListener('click', applyFilters);
}

function applyFilters() {
    const dateRange = document.getElementById('dateRangeFilter').value;
    const source = document.getElementById('sourceFilter').value;
    let startDate, endDate;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch(dateRange) {
        case 'today':
            startDate = today.toISOString().split('T')[0];
            endDate = startDate;
            break;
        case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = yesterday.toISOString().split('T')[0];
            endDate = startDate;
            break;
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - 7);
            startDate = weekStart.toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
            break;
        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            startDate = monthStart.toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
            break;
        case 'custom':
            startDate = document.getElementById('startDate').value;
            endDate = document.getElementById('endDate').value;
            break;
    }
    
    loadMilkRecords({ startDate, endDate, source });
}

// Export Records
function exportRecords() {
    // Use mock data for the export since we're having permission issues
    const mockRecords = [
        {
            id: 'mock1',
            date: '2023-06-01',
            source: 'Sharma Dairy',
            quantity: 2.5,
            price: 50,
            note: 'Morning delivery'
        },
        {
            id: 'mock2',
            date: '2023-06-02',
            source: 'Gupta Milk',
            quantity: 2.0,
            price: 48,
            note: 'Evening delivery'
        }
    ];
    
    // Convert to CSV
    const csvContent = convertToCSV(mockRecords);
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `milk_records_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('Records exported successfully! (Mock)', 'success');
}

function convertToCSV(records) {
    const headers = ['Date', 'Source', 'Quantity (L)', 'Price (₹)', 'Total (₹)', 'Note'];
    const rows = records.map(record => [
        record.date,
        record.source,
        record.quantity,
        record.price,
        (record.quantity * record.price).toFixed(2),
        record.note || ''
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

// Update Pagination
function updatePagination() {
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const paginationInfo = document.getElementById('paginationInfo');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (paginationInfo) {
        paginationInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    }
    
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage <= 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    // Add event listeners for pagination buttons
    if (prevPageBtn) {
        prevPageBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadMilkRecords();
            }
        };
    }
    
    if (nextPageBtn) {
        nextPageBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadMilkRecords();
            }
        };
    }
}

// Function to remove auto-update source (for the UI demo)
function removeAutoUpdateSource(id) {
    console.log('Removing auto-update source:', id);
    showNotification('Source removed from auto-update', 'success');
    loadAutoUpdateSources(); // Reload the list
}

// Make sure exportRecords is attached to the export button
document.addEventListener('DOMContentLoaded', () => {
    const exportRecordsBtn = document.getElementById('exportRecordsBtn');
    if (exportRecordsBtn) {
        exportRecordsBtn.addEventListener('click', exportRecords);
    }
});

// Generate mock data for development/testing
function useMockRecordsData() {
    // This function is no longer needed - we'll show an empty state instead
    showEmptyStateMessage('No milk records found yet. Add your first record!');
}

// Load mock sources
function loadMockSources() {
    // This function is no longer needed - we'll show default state instead
    const sourceDropdown = document.getElementById('recordSource');
    const extraMilkSourceDropdown = document.getElementById('extraMilkSource');
    const sourceFilter = document.getElementById('sourceFilter');
    
    if (sourceDropdown) {
        // Add a redirect option if no sources are found
        const option = document.createElement('option');
        option.value = "no_sources";
        option.textContent = "No sources found - Add one first";
        sourceDropdown.appendChild(option);
        
        sourceDropdown.addEventListener('change', function() {
            if (this.value === "no_sources") {
                window.location.href = 'sources-pricing.html';
            }
        });
    }
}
      