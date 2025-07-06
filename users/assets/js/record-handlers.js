/**
 * Record Handlers - Functions for handling milk record operations
 * This file contains functions for adding, editing, and managing milk records
 * with Firebase Realtime Database integration
 */

// Populate sources dropdown with data from Firebase
function populateSourcesDropdown() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const dropdown = document.getElementById('recordSource');
    if (!dropdown) return;
    
    // Keep only the first option and the 'Add New Source' option
    const firstOption = dropdown.options[0];
    const addNewOption = Array.from(dropdown.options).find(option => option.value === 'manual');
    
    dropdown.innerHTML = '';
    dropdown.appendChild(firstOption);
    
    // Show loading state
    const loadingOption = document.createElement('option');
    loadingOption.text = 'Loading sources...';
    loadingOption.disabled = true;
    dropdown.appendChild(loadingOption);
    
    // Fetch sources from Firebase
    firebase.database().ref('sources/' + user.uid)
        .once('value')
        .then(snapshot => {
            // Remove loading option
            dropdown.removeChild(loadingOption);
            
            if (snapshot.exists()) {
                // Add each source to dropdown
                snapshot.forEach(childSnapshot => {
                    const source = childSnapshot.val();
                    const option = document.createElement('option');
                    option.value = source.name;
                    option.text = source.name;
                    dropdown.appendChild(option);
                });
            }
            
            // Add the 'Add New Source' option back
            if (addNewOption) {
                dropdown.appendChild(addNewOption);
            } else {
                const newOption = document.createElement('option');
                newOption.value = 'manual';
                newOption.text = 'Add New Source';
                dropdown.appendChild(newOption);
            }
        })
        .catch(error => {
            console.error('Error fetching sources:', error);
            dropdown.removeChild(loadingOption);
            
            // Add the 'Add New Source' option back
            if (addNewOption) {
                dropdown.appendChild(addNewOption);
            } else {
                const newOption = document.createElement('option');
                newOption.value = 'manual';
                newOption.text = 'Add New Source';
                dropdown.appendChild(newOption);
            }
        });
}

// Handle add record form submission
function setupAddRecordForm() {
    const addRecordForm = document.getElementById('addRecordForm');
    if (!addRecordForm) return;
    
    addRecordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('You must be logged in to add records');
            return;
        }
        
        // Show loading state
        const submitBtn = addRecordForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }
        
        // Get form values
        const date = document.getElementById('recordDate').value;
        let source = document.getElementById('recordSource').value;
        
        // If manual source is selected, use the manual input
        if (source === 'manual') {
            source = document.getElementById('manualSource').value;
            
            // Also save this as a new source if it doesn't exist
            if (source.trim() !== '') {
                const newSource = {
                    name: source,
                    pricePerLiter: parseFloat(document.getElementById('recordPrice').value) / 
                                  parseFloat(document.getElementById('recordQuantity').value),
                    contact: document.getElementById('recordContact').value || '',
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };
                
                firebase.database().ref('sources/' + user.uid + '/' + source.replace(/[.#$/\[\]]/g, '_'))
                    .set(newSource)
                    .catch(error => {
                        console.error('Error saving new source:', error);
                    });
            }
        }
        
        const quantity = parseFloat(document.getElementById('recordQuantity').value);
        const price = parseFloat(document.getElementById('recordPrice').value);
        const note = document.getElementById('recordNote').value;
        const contact = document.getElementById('recordContact').value;
        
        // Create record object
        const record = {
            date,
            source,
            quantity,
            price,
            note,
            contact,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Save record to Firebase
        const newRecordRef = firebase.database().ref('milkRecords/' + user.uid).push();
        newRecordRef.set(record)
            .then(() => {
                console.log('Record saved to Firebase');
                
                // Show success message
                showToast('Record added successfully');
                
                // Close modal
                const addRecordModal = document.getElementById('addRecordModal');
                if (addRecordModal) addRecordModal.classList.remove('active');
                
                // Refresh dashboard data
                if (typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
            })
            .catch(error => {
                console.error('Error saving record:', error);
                showToast('Error saving record. Please try again.');
            })
            .finally(() => {
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Save Record';
                }
            });
    });
    
    // Handle record source selection
    const recordSource = document.getElementById('recordSource');
    const manualSourceGroup = document.getElementById('manualSourceGroup');
    
    if (recordSource && manualSourceGroup) {
        recordSource.addEventListener('change', function() {
            if (this.value === 'manual') {
                manualSourceGroup.style.display = 'block';
            } else {
                manualSourceGroup.style.display = 'none';
            }
        });
    }
}

// Initialize record handlers
document.addEventListener('DOMContentLoaded', function() {
    // Setup add record form when document is ready
    setupAddRecordForm();
    
    // Add Record button opens the add record modal
    document.getElementById('addRecordBtn')?.addEventListener('click', function() {
        const addRecordModal = document.getElementById('addRecordModal');
        if (addRecordModal) {
            // Set default date to today
            document.getElementById('recordDate').valueAsDate = new Date();
            
            // Populate source dropdown with actual sources from Firebase
            populateSourcesDropdown();
            
            // Show the modal
            addRecordModal.classList.add('active');
        }
    });
    
    // Cancel button closes the modal
    document.getElementById('cancelRecordBtn')?.addEventListener('click', function() {
        const addRecordModal = document.getElementById('addRecordModal');
        if (addRecordModal) addRecordModal.classList.remove('active');
    });
});