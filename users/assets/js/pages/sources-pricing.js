// DOM Elements
const addNewSourceBtn = document.getElementById('addNewSourceBtn');
const sourcesGrid = document.getElementById('sourcesGrid');
const sourceTypeFilter = document.getElementById('sourceTypeFilter');
const frequencyFilter = document.getElementById('frequencyFilter');
const historySourceSelect = document.getElementById('historySourceSelect');
const pricingTimeline = document.getElementById('pricingTimeline');

// Modals
const sourceModal = document.getElementById('sourceModal');
const updatePriceModal = document.getElementById('updatePriceModal');

// Forms
const sourceForm = document.getElementById('sourceForm');
const updatePriceForm = document.getElementById('updatePriceForm');

// Firebase References
const sourcesRef = firebase.database().ref('sources');
const priceHistoryRef = firebase.database().ref('priceHistory');

// Current User
let currentUser = null;
let currentSources = [];
let selectedSourceId = null;

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
    loadSources();
    setupEventListeners();
}

// Load Sources
function loadSources(filters = {}) {
    try {
        if (!currentUser || !currentUser.uid) {
            console.error('No user ID available for fetching sources');
            // Use mock data for development/testing
            useMockSourcesData();
            return;
        }
        
        sourcesRef.child(currentUser.uid).once('value')
            .then((snapshot) => {
                let sources = [];
                snapshot.forEach((childSnapshot) => {
                    sources.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                // Apply filters if present
                if (filters.type && filters.type !== 'all') {
                    sources = sources.filter(source => source.milkType === filters.type);
                }
                
                if (filters.frequency && filters.frequency !== 'all') {
                    sources = sources.filter(source => source.frequency === filters.frequency);
                }
                
                // Sort sources by name
                sources.sort((a, b) => a.name.localeCompare(b.name));
                
                currentSources = sources;
                displaySources(sources);
                populateSourcesDropdown(sources);
            })
            .catch((error) => {
                console.error('Error loading sources:', error);
                showNotification('Error loading sources: ' + error.message, 'error');
                // Use mock data as fallback
                useMockSourcesData();
            });
    } catch (error) {
        console.error('Exception in loadSources:', error);
        showNotification('Error loading sources: ' + error.message, 'error');
        // Use mock data as fallback
        useMockSourcesData();
    }
}

// Generate mock data for development/testing
function useMockSourcesData() {
    console.log('Using mock sources data for development/testing');
    
    // Create mock sources
    const mockSources = [
        {
            id: 'mock1',
            name: 'Ramesh Dairy',
            contact: '+91 98765 43210',
            location: 'Andheri East',
            startDate: '2022-10-05',
            milkType: 'cow',
            price: 60,
            frequency: 'daily',
            note: 'Morning delivery at 7 AM'
        },
        {
            id: 'mock2',
            name: 'Suresh Milk Farm',
            contact: '+91 97654 32109',
            location: 'Bandra West',
            startDate: '2022-11-15',
            milkType: 'buffalo',
            price: 75,
            frequency: 'daily',
            note: 'Evening delivery at 6 PM'
        },
        {
            id: 'mock3',
            name: 'City Fresh Dairy',
            contact: '+91 96543 21098',
            location: 'Dadar',
            startDate: '2023-01-20',
            milkType: 'mixed',
            price: 65,
            frequency: 'occasional',
            note: 'Call before delivery'
        }
    ];
    
    // Mock price history
    const mockPriceHistory = [
        {
            id: 'hist1',
            sourceId: 'mock1',
            oldPrice: 55,
            newPrice: 60,
            date: '2023-05-15',
            reason: 'Price increased due to higher fodder costs.'
        },
        {
            id: 'hist2',
            sourceId: 'mock1',
            oldPrice: 58,
            newPrice: 55,
            date: '2023-01-10',
            reason: 'Seasonal price adjustment after winter.'
        },
        {
            id: 'hist3',
            sourceId: 'mock1',
            oldPrice: null,
            newPrice: 58,
            date: '2022-10-05',
            reason: 'Started sourcing milk from Ramesh Dairy.'
        }
    ];
    
    // Store mock data for later use
    currentSources = mockSources;
    displaySources(mockSources);
    populateSourcesDropdown(mockSources);
    
    // Display mock price history
    displayPriceHistory('mock1');
}

// Display Sources
function displaySources(sources) {
    sourcesGrid.innerHTML = '';
    
    if (sources.length === 0) {
        sourcesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-store-slash"></i>
                <p>No sources found</p>
                <button class="btn btn-primary" onclick="openAddSourceModal()">Add Source</button>
            </div>
        `;
        return;
    }
    
    sources.forEach(source => {
        const sourceCard = document.createElement('div');
        sourceCard.className = 'source-card';
        sourceCard.innerHTML = `
            <div class="source-header">
                <span class="source-name">${source.name}</span>
                <span class="source-type ${source.milkType}">${capitalizeFirstLetter(source.milkType)}</span>
            </div>
            <div class="source-info">
                <div class="source-info-item">
                    <span class="info-label">Contact</span>
                    <span class="info-value">${source.contact || 'N/A'}</span>
                </div>
                <div class="source-info-item">
                    <span class="info-label">Location</span>
                    <span class="info-value">${source.location || 'N/A'}</span>
                </div>
                <div class="source-info-item">
                    <span class="info-label">Current Price</span>
                    <span class="info-value">₹${source.price.toFixed(2)}/L</span>
                </div>
                <div class="source-info-item">
                    <span class="info-label">Frequency</span>
                    <span class="info-value">${capitalizeFirstLetter(source.frequency)}</span>
                </div>
            </div>
            <div class="source-actions">
                <button class="source-action-btn view-history" data-id="${source.id}">
                    <i class="fas fa-history"></i> View History
                </button>
                <button class="source-action-btn update-price" data-id="${source.id}">
                    <i class="fas fa-tag"></i> Update Price
                </button>
                <button class="source-action-btn edit" data-id="${source.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="source-action-btn delete" data-id="${source.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        sourcesGrid.appendChild(sourceCard);
        
        // Add event listeners to the buttons
        const viewHistoryBtn = sourceCard.querySelector('.view-history');
        const updatePriceBtn = sourceCard.querySelector('.update-price');
        const editBtn = sourceCard.querySelector('.edit');
        const deleteBtn = sourceCard.querySelector('.delete');
        
        viewHistoryBtn.addEventListener('click', () => {
            historySourceSelect.value = source.id;
            displayPriceHistory(source.id);
            // Scroll to the history section
            document.querySelector('.pricing-history-container').scrollIntoView({ behavior: 'smooth' });
        });
        
        updatePriceBtn.addEventListener('click', () => openUpdatePriceModal(source));
        editBtn.addEventListener('click', () => openEditSourceModal(source));
        deleteBtn.addEventListener('click', () => confirmDeleteSource(source));
    });
}

// Populate Sources Dropdown
function populateSourcesDropdown(sources) {
    historySourceSelect.innerHTML = '<option value="">Select Source</option>';
    
    sources.forEach(source => {
        const option = document.createElement('option');
        option.value = source.id;
        option.textContent = source.name;
        historySourceSelect.appendChild(option);
    });
}

// Display Price History
function displayPriceHistory(sourceId) {
    selectedSourceId = sourceId;
    pricingTimeline.innerHTML = '';
    
    if (!sourceId) {
        pricingTimeline.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>Select a source to view price history</p>
            </div>
        `;
        return;
    }
    
    // Create timeline line
    const timelineLine = document.createElement('div');
    timelineLine.className = 'timeline-line';
    pricingTimeline.appendChild(timelineLine);
    
    try {
        if (!currentUser || !currentUser.uid) {
            console.error('No user ID available for fetching price history');
            // Use mock data for this demo
            displayMockPriceHistory(sourceId);
            return;
        }
        
        priceHistoryRef.child(currentUser.uid).child(sourceId).once('value')
            .then((snapshot) => {
                let history = [];
                snapshot.forEach((childSnapshot) => {
                    history.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                // Sort history by date (newest first)
                history.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                if (history.length === 0) {
                    // Add initial price from source data
                    const source = currentSources.find(s => s.id === sourceId);
                    if (source) {
                        const initialItem = createTimelineItem({
                            date: source.startDate,
                            oldPrice: null,
                            newPrice: source.price,
                            reason: `Started sourcing milk from ${source.name}.`
                        });
                        pricingTimeline.appendChild(initialItem);
                    } else {
                        pricingTimeline.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-history"></i>
                                <p>No price history available</p>
                            </div>
                        `;
                    }
                    return;
                }
                
                // Display history items
                history.forEach(item => {
                    const timelineItem = createTimelineItem(item);
                    pricingTimeline.appendChild(timelineItem);
                });
            })
            .catch((error) => {
                console.error('Error loading price history:', error);
                showNotification('Error loading price history: ' + error.message, 'error');
                // Use mock data as fallback
                displayMockPriceHistory(sourceId);
            });
    } catch (error) {
        console.error('Exception in displayPriceHistory:', error);
        showNotification('Error loading price history: ' + error.message, 'error');
        // Use mock data as fallback
        displayMockPriceHistory(sourceId);
    }
}

// Display mock price history (for development/testing)
function displayMockPriceHistory(sourceId) {
    console.log('Using mock price history data for development/testing');
    
    // Mock price history for this demo
    const mockHistory = [
        {
            date: '2023-05-15',
            oldPrice: 55,
            newPrice: 60,
            reason: 'Price increased due to higher fodder costs.'
        },
        {
            date: '2023-01-10',
            oldPrice: 58,
            newPrice: 55,
            reason: 'Seasonal price adjustment after winter.'
        },
        {
            date: '2022-10-05',
            oldPrice: null,
            newPrice: 58,
            reason: 'Started sourcing milk from this supplier.'
        }
    ];
    
    mockHistory.forEach(item => {
        const timelineItem = createTimelineItem(item);
        pricingTimeline.appendChild(timelineItem);
    });
}

// Create Timeline Item
function createTimelineItem(item) {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    
    let pointClass = '';
    let changeIcon = '';
    let changePercent = '';
    
    if (item.oldPrice) {
        const priceDiff = item.newPrice - item.oldPrice;
        const percentChange = (priceDiff / item.oldPrice) * 100;
        
        if (priceDiff > 0) {
            pointClass = 'increase';
            changeIcon = '<i class="fas fa-arrow-up timeline-change-icon increase"></i>';
            changePercent = `<span class="timeline-change-percent">(+${Math.abs(percentChange).toFixed(2)}%)</span>`;
        } else if (priceDiff < 0) {
            pointClass = 'decrease';
            changeIcon = '<i class="fas fa-arrow-down timeline-change-icon decrease"></i>';
            changePercent = `<span class="timeline-change-percent">(-${Math.abs(percentChange).toFixed(2)}%)</span>`;
        }
    }
    
    timelineItem.innerHTML = `
        <div class="timeline-date">${formatDate(item.date)}</div>
        <div class="timeline-point ${pointClass}"></div>
        <div class="timeline-content">
            <div class="timeline-price-change">
                ${item.oldPrice ? `
                    <span class="timeline-old-price">₹${item.oldPrice.toFixed(2)}/L</span>
                    <i class="fas fa-arrow-right timeline-change-icon"></i>
                ` : ''}
                <span class="timeline-new-price">₹${item.newPrice.toFixed(2)}/L</span>
                ${changeIcon}
                ${changePercent}
                ${!item.oldPrice ? '<span class="timeline-change-label">(Initial Price)</span>' : ''}
            </div>
            <div class="timeline-note">
                ${item.reason || ''}
            </div>
        </div>
    `;
    
    return timelineItem;
}

// Open Add Source Modal
function openAddSourceModal() {
    document.getElementById('sourceModalTitle').textContent = 'Add New Source';
    document.getElementById('sourceId').value = '';
    sourceForm.reset();
    
    // Set default date to today
    document.getElementById('sourceStartDate').value = new Date().toISOString().split('T')[0];
    
    // Show the modal
    sourceModal.style.display = 'flex';
}

// Open Edit Source Modal
function openEditSourceModal(source) {
    document.getElementById('sourceModalTitle').textContent = 'Edit Source';
    document.getElementById('sourceId').value = source.id;
    
    // Fill the form with source data
    document.getElementById('sourceName').value = source.name;
    document.getElementById('sourceContact').value = source.contact || '';
    document.getElementById('sourceLocation').value = source.location || '';
    document.getElementById('sourceStartDate').value = source.startDate;
    document.getElementById('sourcePrice').value = source.price;
    document.getElementById('sourceNote').value = source.note || '';
    
    // Set milk type radio button
    document.querySelector(`input[name="milkType"][value="${source.milkType}"]`).checked = true;
    
    // Set purchase frequency radio button
    document.querySelector(`input[name="purchaseFrequency"][value="${source.frequency}"]`).checked = true;
    
    // Show the modal
    sourceModal.style.display = 'flex';
}

// Open Update Price Modal
function openUpdatePriceModal(source) {
    document.getElementById('updateSourceId').value = source.id;
    document.getElementById('updateSourceName').value = source.name;
    document.getElementById('currentPrice').value = source.price;
    document.getElementById('newPrice').value = '';
    
    // Set effective date to today
    document.getElementById('priceChangeDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('priceChangeReason').value = '';
    
    // Show the modal
    updatePriceModal.style.display = 'flex';
}

// Confirm Delete Source
function confirmDeleteSource(source) {
    if (confirm(`Are you sure you want to delete ${source.name}? This action cannot be undone.`)) {
        deleteSource(source.id);
    }
}

// Save Source
function saveSource(event) {
    event.preventDefault();
    
    const sourceId = document.getElementById('sourceId').value;
    const sourceName = document.getElementById('sourceName').value;
    const sourceContact = document.getElementById('sourceContact').value;
    const sourceLocation = document.getElementById('sourceLocation').value;
    const sourceStartDate = document.getElementById('sourceStartDate').value;
    const milkType = document.querySelector('input[name="milkType"]:checked').value;
    const sourcePrice = parseFloat(document.getElementById('sourcePrice').value);
    const purchaseFrequency = document.querySelector('input[name="purchaseFrequency"]:checked').value;
    const sourceNote = document.getElementById('sourceNote').value;
    
    const sourceData = {
        name: sourceName,
        contact: sourceContact,
        location: sourceLocation,
        startDate: sourceStartDate,
        milkType: milkType,
        price: sourcePrice,
        frequency: purchaseFrequency,
        note: sourceNote,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        if (!currentUser || !currentUser.uid) {
            console.error('No user ID available for saving source');
            showNotification('Please log in to save source', 'error');
            return;
        }
        
        let savePromise;
        
        if (sourceId) {
            // Update existing source
            savePromise = sourcesRef.child(currentUser.uid).child(sourceId).update(sourceData);
        } else {
            // Add new source
            savePromise = sourcesRef.child(currentUser.uid).push({
                ...sourceData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
        
        savePromise.then(() => {
            showNotification(`Source ${sourceId ? 'updated' : 'added'} successfully!`, 'success');
            closeModal(sourceModal);
            loadSources();
            
            // If this is a new source, add an initial price history entry
            if (!sourceId) {
                // Get the new source ID from the push operation
                // For this demo, we'll simulate it with a mock ID
                const newSourceId = 'new' + Date.now();
                
                const initialPriceData = {
                    date: sourceStartDate,
                    oldPrice: null,
                    newPrice: sourcePrice,
                    reason: `Started sourcing milk from ${sourceName}.`,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };
                
                priceHistoryRef.child(currentUser.uid).child(newSourceId).push(initialPriceData)
                    .catch(error => {
                        console.error('Error saving initial price history:', error);
                    });
            }
        }).catch((error) => {
            console.error('Error saving source:', error);
            showNotification('Error saving source: ' + error.message, 'error');
        });
    } catch (error) {
        console.error('Exception in saveSource:', error);
        showNotification('Error saving source: ' + error.message, 'error');
    }
}

// Update Price
function updatePrice(event) {
    event.preventDefault();
    
    const sourceId = document.getElementById('updateSourceId').value;
    const currentPrice = parseFloat(document.getElementById('currentPrice').value);
    const newPrice = parseFloat(document.getElementById('newPrice').value);
    const changeDate = document.getElementById('priceChangeDate').value;
    const changeReason = document.getElementById('priceChangeReason').value;
    
    if (newPrice === currentPrice) {
        showNotification('New price must be different from current price', 'warning');
        return;
    }
    
    const priceHistoryData = {
        date: changeDate,
        oldPrice: currentPrice,
        newPrice: newPrice,
        reason: changeReason,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        if (!currentUser || !currentUser.uid) {
            console.error('No user ID available for updating price');
            showNotification('Please log in to update price', 'error');
            return;
        }
        
        // Update the price in the source record
        sourcesRef.child(currentUser.uid).child(sourceId).update({
            price: newPrice,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            // Add the price change to history
            return priceHistoryRef.child(currentUser.uid).child(sourceId).push(priceHistoryData);
        }).then(() => {
            showNotification('Price updated successfully!', 'success');
            closeModal(updatePriceModal);
            loadSources();
            
            // If this source is currently selected in the history view, refresh it
            if (selectedSourceId === sourceId) {
                displayPriceHistory(sourceId);
            }
        }).catch((error) => {
            console.error('Error updating price:', error);
            showNotification('Error updating price: ' + error.message, 'error');
        });
    } catch (error) {
        console.error('Exception in updatePrice:', error);
        showNotification('Error updating price: ' + error.message, 'error');
    }
}

// Delete Source
function deleteSource(sourceId) {
    try {
        if (!currentUser || !currentUser.uid) {
            console.error('No user ID available for deleting source');
            showNotification('Please log in to delete source', 'error');
            return;
        }
        
        // Delete the source
        sourcesRef.child(currentUser.uid).child(sourceId).remove()
            .then(() => {
                // Also delete any price history for this source
                return priceHistoryRef.child(currentUser.uid).child(sourceId).remove();
            })
            .then(() => {
                showNotification('Source deleted successfully!', 'success');
                loadSources();
                
                // If this source was selected in the history view, clear it
                if (selectedSourceId === sourceId) {
                    selectedSourceId = null;
                    historySourceSelect.value = '';
                    displayPriceHistory(null);
                }
            })
            .catch((error) => {
                console.error('Error deleting source:', error);
                showNotification('Error deleting source: ' + error.message, 'error');
            });
    } catch (error) {
        console.error('Exception in deleteSource:', error);
        showNotification('Error deleting source: ' + error.message, 'error');
    }
}

// Apply Filters
function applyFilters() {
    const typeFilter = sourceTypeFilter.value;
    const freqFilter = frequencyFilter.value;
    
    loadSources({
        type: typeFilter,
        frequency: freqFilter
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Add New Source Button
    addNewSourceBtn.addEventListener('click', openAddSourceModal);
    
    // Source Form Submit
    sourceForm.addEventListener('submit', saveSource);
    
    // Update Price Form Submit
    updatePriceForm.addEventListener('submit', updatePrice);
    
    // History Source Select
    historySourceSelect.addEventListener('change', () => {
        displayPriceHistory(historySourceSelect.value);
    });
    
    // Filters
    sourceTypeFilter.addEventListener('change', applyFilters);
    frequencyFilter.addEventListener('change', applyFilters);
    
    // Close Modal Buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });
    
    // Cancel Buttons
    document.getElementById('cancelSourceBtn').addEventListener('click', () => {
        closeModal(sourceModal);
    });
    
    document.getElementById('cancelPriceUpdateBtn').addEventListener('click', () => {
        closeModal(updatePriceModal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            toggleDarkMode(this.checked);
        });
    }
}

// Helper Functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showNotification(message, type) {
    // This function would be implemented in utils.js
    console.log(`${type.toUpperCase()}: ${message}`);
}

function closeModal(modal) {
    modal.style.display = 'none';
} 