// Notifications Page JavaScript

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            initializeNotificationsPage(user);
        } else {
            // No user is signed in, redirect to login
            window.location.href = '../auth/login.html';
        }
    });
});

// Initialize Notifications Page
function initializeNotificationsPage(user) {
    // DOM Elements
    const notificationsList = document.getElementById('notificationsList');
    const emptyNotifications = document.getElementById('emptyNotifications');
    const notificationBadge = document.getElementById('notificationBadge');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const refreshNotificationsBtn = document.getElementById('refreshNotificationsBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const notificationTypeFilter = document.getElementById('notificationTypeFilter');
    const notificationStatusFilter = document.getElementById('notificationStatusFilter');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmationTitle = document.getElementById('confirmationTitle');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const cancelConfirmationBtn = document.getElementById('cancelConfirmationBtn');
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    
    // Store all notifications
    let allNotifications = [];
    
    // Load notifications
    loadNotifications();
    
    // Set up event listeners
    markAllReadBtn.addEventListener('click', markAllAsRead);
    refreshNotificationsBtn.addEventListener('click', refreshNotifications);
    clearAllBtn.addEventListener('click', showClearAllConfirmation);
    notificationTypeFilter.addEventListener('change', applyFilters);
    notificationStatusFilter.addEventListener('change', applyFilters);
    
    // Close confirmation modal
    document.querySelector('#confirmationModal .close-modal').addEventListener('click', function() {
        confirmationModal.style.display = 'none';
    });
    
    // Cancel confirmation
    cancelConfirmationBtn.addEventListener('click', function() {
        confirmationModal.style.display = 'none';
    });
    
    // Set up Firebase realtime listener for new notifications
    setupRealtimeListener();
    
    // Load notifications from Firebase
    function loadNotifications() {
        firebase.database().ref('users/' + user.uid + '/notifications').once('value')
            .then(function(snapshot) {
                const data = snapshot.val() || {};
                
                // Convert object to array
                allNotifications = Object.keys(data).map(key => {
                    return {
                        id: key,
                        ...data[key]
                    };
                });
                
                // Sort by timestamp (newest first)
                allNotifications.sort((a, b) => b.timestamp - a.timestamp);
                
                // Update UI
                updateNotificationsList();
                updateUnreadBadge();
            })
            .catch(function(error) {
                showToast('Error', 'Failed to load notifications: ' + error.message, 'error');
            });
    }
    
    // Update notifications list based on filters
    function updateNotificationsList() {
        // Clear current list
        while (notificationsList.firstChild && notificationsList.firstChild !== emptyNotifications) {
            notificationsList.removeChild(notificationsList.firstChild);
        }
        
        // Get filter values
        const typeFilter = notificationTypeFilter.value;
        const statusFilter = notificationStatusFilter.value;
        
        // Filter notifications
        let filteredNotifications = allNotifications;
        
        if (typeFilter !== 'all') {
            filteredNotifications = filteredNotifications.filter(notif => notif.type === typeFilter);
        }
        
        if (statusFilter !== 'all') {
            const isRead = statusFilter === 'read';
            filteredNotifications = filteredNotifications.filter(notif => notif.read === isRead);
        }
        
        // Show empty state if no notifications
        if (filteredNotifications.length === 0) {
            emptyNotifications.style.display = 'flex';
        } else {
            emptyNotifications.style.display = 'none';
            
            // Create notification items
            filteredNotifications.forEach(notification => {
                const notificationItem = createNotificationItem(notification);
                notificationsList.appendChild(notificationItem);
            });
        }
    }
    
    // Create notification item
    function createNotificationItem(notification) {
        // Clone template
        const template = document.getElementById('notificationTemplate');
        const notificationItem = template.content.cloneNode(true).querySelector('.notification-item');
        
        // Set data attributes
        notificationItem.dataset.id = notification.id;
        notificationItem.dataset.type = notification.type;
        notificationItem.dataset.read = notification.read;
        
        // Set content
        const icon = notificationItem.querySelector('.notification-icon i');
        const title = notificationItem.querySelector('.notification-title');
        const time = notificationItem.querySelector('.notification-time');
        const message = notificationItem.querySelector('.notification-message');
        const markReadBtn = notificationItem.querySelector('.notification-action.mark-read');
        const deleteBtn = notificationItem.querySelector('.notification-action.delete');
        
        // Set icon based on type
        switch (notification.type) {
            case 'reminder':
                icon.className = 'fas fa-bell';
                break;
            case 'insight':
                icon.className = 'fas fa-lightbulb';
                break;
            case 'alert':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                icon.className = 'fas fa-info-circle';
        }
        
        // Set content
        title.textContent = notification.title;
        message.textContent = notification.message;
        time.textContent = formatTimestamp(notification.timestamp);
        
        // Update mark read button
        if (notification.read) {
            markReadBtn.title = 'Already read';
            markReadBtn.disabled = true;
            markReadBtn.style.opacity = '0.5';
        } else {
            markReadBtn.title = 'Mark as read';
        }
        
        // Add event listeners
        markReadBtn.addEventListener('click', function() {
            markAsRead(notification.id);
        });
        
        deleteBtn.addEventListener('click', function() {
            deleteNotification(notification.id);
        });
        
        // Make the notification clickable to mark as read
        notificationItem.addEventListener('click', function(e) {
            // Only mark as read if not clicking on action buttons
            if (!e.target.closest('.notification-action')) {
                markAsRead(notification.id);
            }
        });
        
        return notificationItem;
    }
    
    // Format timestamp to relative time
    function formatTimestamp(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        // Less than a minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than an hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
        }
        
        // Less than a day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return hours + (hours === 1 ? ' hour ago' : ' hours ago');
        }
        
        // Less than a week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return days + (days === 1 ? ' day ago' : ' days ago');
        }
        
        // Format as date
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        });
    }
    
    // Mark notification as read
    function markAsRead(notificationId) {
        // Find notification in array
        const notification = allNotifications.find(n => n.id === notificationId);
        
        // If already read, do nothing
        if (notification && notification.read) return;
        
        // Update in Firebase
        firebase.database().ref('users/' + user.uid + '/notifications/' + notificationId).update({
            read: true
        })
        .then(function() {
            // Update local array
            notification.read = true;
            
            // Update UI
            const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.dataset.read = 'true';
                
                const markReadBtn = notificationItem.querySelector('.notification-action.mark-read');
                markReadBtn.title = 'Already read';
                markReadBtn.disabled = true;
                markReadBtn.style.opacity = '0.5';
            }
            
            // Update unread badge
            updateUnreadBadge();
        })
        .catch(function(error) {
            showToast('Error', 'Failed to mark notification as read', 'error');
        });
    }
    
    // Mark all notifications as read
    function markAllAsRead() {
        // Get unread notifications
        const unreadNotifications = allNotifications.filter(n => !n.read);
        
        if (unreadNotifications.length === 0) {
            showToast('Info', 'No unread notifications', 'info');
            return;
        }
        
        // Create updates object
        const updates = {};
        unreadNotifications.forEach(notification => {
            updates[notification.id] = { ...notification, read: true };
        });
        
        // Update in Firebase
        firebase.database().ref('users/' + user.uid + '/notifications').update(updates)
            .then(function() {
                // Update local array
                unreadNotifications.forEach(notification => {
                    notification.read = true;
                });
                
                // Update UI
                updateNotificationsList();
                updateUnreadBadge();
                
                showToast('Success', 'All notifications marked as read', 'success');
            })
            .catch(function(error) {
                showToast('Error', 'Failed to mark all as read: ' + error.message, 'error');
            });
    }
    
    // Delete notification
    function deleteNotification(notificationId) {
        // Delete from Firebase
        firebase.database().ref('users/' + user.uid + '/notifications/' + notificationId).remove()
            .then(function() {
                // Remove from local array
                allNotifications = allNotifications.filter(n => n.id !== notificationId);
                
                // Update UI
                const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
                if (notificationItem) {
                    notificationItem.style.height = notificationItem.offsetHeight + 'px';
                    notificationItem.style.opacity = '0';
                    notificationItem.style.marginTop = '-' + notificationItem.offsetHeight + 'px';
                    
                    setTimeout(() => {
                        notificationItem.remove();
                        
                        // Show empty state if no notifications left
                        if (allNotifications.length === 0) {
                            emptyNotifications.style.display = 'flex';
                        }
                    }, 300);
                }
                
                // Update unread badge
                updateUnreadBadge();
                
                showToast('Success', 'Notification deleted', 'success');
            })
            .catch(function(error) {
                showToast('Error', 'Failed to delete notification: ' + error.message, 'error');
            });
    }
    
    // Show clear all confirmation
    function showClearAllConfirmation() {
        if (allNotifications.length === 0) {
            showToast('Info', 'No notifications to clear', 'info');
            return;
        }
        
        confirmationTitle.textContent = 'Clear All Notifications';
        confirmationMessage.textContent = 'Are you sure you want to delete all notifications? This action cannot be undone.';
        
        // Set confirm action
        confirmActionBtn.onclick = clearAllNotifications;
        
        // Show modal
        confirmationModal.style.display = 'flex';
    }
    
    // Clear all notifications
    function clearAllNotifications() {
        // Close modal
        confirmationModal.style.display = 'none';
        
        // Delete from Firebase
        firebase.database().ref('users/' + user.uid + '/notifications').remove()
            .then(function() {
                // Clear local array
                allNotifications = [];
                
                // Update UI
                updateNotificationsList();
                updateUnreadBadge();
                
                showToast('Success', 'All notifications cleared', 'success');
            })
            .catch(function(error) {
                showToast('Error', 'Failed to clear notifications: ' + error.message, 'error');
            });
    }
    
    // Refresh notifications
    function refreshNotifications() {
        // Show loading state
        refreshNotificationsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        refreshNotificationsBtn.disabled = true;
        
        // Load notifications
        loadNotifications();
        
        // Reset button after a short delay
        setTimeout(() => {
            refreshNotificationsBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Refresh</span>';
            refreshNotificationsBtn.disabled = false;
            
            showToast('Success', 'Notifications refreshed', 'success');
        }, 1000);
    }
    
    // Apply filters
    function applyFilters() {
        updateNotificationsList();
    }
    
    // Update unread badge
    function updateUnreadBadge() {
        const unreadCount = allNotifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
    
    // Setup realtime listener for new notifications
    function setupRealtimeListener() {
        const notificationsRef = firebase.database().ref('users/' + user.uid + '/notifications');
        
        // Listen for new notifications
        notificationsRef.on('child_added', function(snapshot) {
            const newNotification = {
                id: snapshot.key,
                ...snapshot.val()
            };
            
            // Check if notification already exists in our array
            const exists = allNotifications.some(n => n.id === newNotification.id);
            
            if (!exists) {
                // Add to local array
                allNotifications.unshift(newNotification);
                
                // Sort by timestamp (newest first)
                allNotifications.sort((a, b) => b.timestamp - a.timestamp);
                
                // Update UI
                updateNotificationsList();
                updateUnreadBadge();
                
                // Show toast for new unread notification
                if (!newNotification.read) {
                    showToast(newNotification.title, newNotification.message, 'info');
                }
            }
        });
        
        // Listen for removed notifications
        notificationsRef.on('child_removed', function(snapshot) {
            const removedId = snapshot.key;
            
            // Remove from local array
            allNotifications = allNotifications.filter(n => n.id !== removedId);
            
            // Update UI
            updateNotificationsList();
            updateUnreadBadge();
        });
        
        // Listen for changed notifications
        notificationsRef.on('child_changed', function(snapshot) {
            const changedNotification = {
                id: snapshot.key,
                ...snapshot.val()
            };
            
            // Update in local array
            const index = allNotifications.findIndex(n => n.id === changedNotification.id);
            if (index !== -1) {
                allNotifications[index] = changedNotification;
            }
            
            // Update UI
            updateNotificationsList();
            updateUnreadBadge();
        });
    }
}

// Show Toast Notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'warning') icon = 'exclamation-circle';
    
    // Toast content
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Close button functionality
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
} 