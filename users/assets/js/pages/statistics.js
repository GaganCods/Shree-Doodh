// Statistics Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize date range filters
    initDateRangeFilters();
    
    // Initialize charts
    initCharts();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load smart stats
    loadSmartStats();
});

// Initialize date range filters
function initDateRangeFilters() {
    const dateRangeSelect = document.getElementById('dateRangeSelect');
    const customDateRange = document.getElementById('customDateRange');
    
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customDateRange.style.display = 'flex';
            } else {
                customDateRange.style.display = 'none';
                updateChartsForDateRange(this.value);
            }
        });
    }
    
    const applyDateRangeBtn = document.getElementById('applyDateRangeBtn');
    if (applyDateRangeBtn) {
        applyDateRangeBtn.addEventListener('click', function() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (startDate && endDate) {
                updateChartsForCustomDateRange(startDate, endDate);
            }
        });
    }
    
    // Set default date range
    if (dateRangeSelect) {
        updateChartsForDateRange(dateRangeSelect.value);
    }
}

// Initialize event listeners
function initEventListeners() {
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', function() {
            // Show loading state
            document.querySelectorAll('.chart-container').forEach(container => {
                container.classList.add('loading');
            });
            
            // Simulate refresh delay
            setTimeout(() => {
                initCharts();
                loadSmartStats();
                
                // Remove loading state
                document.querySelectorAll('.chart-container').forEach(container => {
                    container.classList.remove('loading');
                });
            }, 800);
        });
    }
    
    const exportStatsBtn = document.getElementById('exportStatsBtn');
    if (exportStatsBtn) {
        exportStatsBtn.addEventListener('click', function() {
            alert('Statistics export functionality will be implemented soon!');
        });
    }
}

// Initialize all charts
function initCharts() {
    // Get all chart canvases
    const quantityChartCanvas = document.getElementById('quantityChart');
    const expenseChartCanvas = document.getElementById('expenseChart');
    const sourceChartCanvas = document.getElementById('sourceChart');
    const priceChartCanvas = document.getElementById('priceChart');
    const weeklyChartCanvas = document.getElementById('weeklyComparisonChart');
    const expenseDistributionCanvas = document.getElementById('expenseDistributionChart');
    
    // Generate sample data
    const dates = generateDateRange(30);
    const quantities = generateRandomData(30, 1, 3);
    const expenses = generateRandomData(30, 50, 180);
    const prices = generateRandomData(30, 50, 65);
    
    // Initialize charts if canvases exist
    if (quantityChartCanvas) initQuantityChart(quantityChartCanvas, dates, quantities);
    if (expenseChartCanvas) initExpenseChart(expenseChartCanvas, dates, expenses);
    if (sourceChartCanvas) initSourceChart(sourceChartCanvas);
    if (priceChartCanvas) initPriceChart(priceChartCanvas, dates, prices);
    if (weeklyChartCanvas) initWeeklyComparisonChart(weeklyChartCanvas);
    if (expenseDistributionCanvas) initExpenseDistributionChart(expenseDistributionCanvas);
}

// Generate date range
function generateDateRange(days) {
    const dates = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        dates.push(date);
    }
    
    return dates;
}

// Generate random data
function generateRandomData(count, min, max) {
    const data = [];
    
    for (let i = 0; i < count; i++) {
        data.push(Math.random() * (max - min) + min);
    }
    
    return data;
}

// Initialize quantity chart
function initQuantityChart(canvas, dates, quantities) {
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Milk Quantity (L)',
                data: quantities,
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgba(76, 175, 80, 1)',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM d, yyyy',
                        displayFormats: {
                            day: 'MMM d'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true
                }
            }
        }
    });
}

// Initialize expense chart
function initExpenseChart(canvas, dates, expenses) {
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Daily Expense (₹)',
                data: expenses,
                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                borderColor: 'rgba(255, 107, 107, 1)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgba(255, 107, 107, 1)',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM d, yyyy',
                        displayFormats: {
                            day: 'MMM d'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true
                }
            }
        }
    });
}

// Initialize source chart
function initSourceChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    canvas.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sharma Dairy', 'Gupta Milk', 'City Fresh'],
            datasets: [{
                data: [45, 30, 25],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(77, 150, 255, 0.8)',
                    'rgba(255, 193, 7, 0.8)'
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(77, 150, 255, 1)',
                    'rgba(255, 193, 7, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${percentage}% (${value}L)`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize price chart
function initPriceChart(canvas, dates, prices) {
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Price per Liter (₹)',
                data: prices,
                backgroundColor: 'rgba(77, 150, 255, 0.2)',
                borderColor: 'rgba(77, 150, 255, 1)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgba(77, 150, 255, 1)',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM d, yyyy',
                        displayFormats: {
                            day: 'MMM d'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true
                }
            }
        }
    });
}

// Initialize weekly comparison chart
function initWeeklyComparisonChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    canvas.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [{
                label: 'Quantity (L)',
                data: [2.5, 2, 2, 2.5, 2, 3, 3],
                backgroundColor: 'rgba(76, 175, 80, 0.8)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.6
            }, {
                label: 'Expense (₹)',
                data: [150, 120, 120, 150, 120, 180, 180],
                backgroundColor: 'rgba(255, 107, 107, 0.8)',
                borderColor: 'rgba(255, 107, 107, 1)',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true
                }
            }
        }
    });
}

// Initialize expense distribution chart
function initExpenseDistributionChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    canvas.chart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Cow Milk', 'Buffalo Milk', 'Mixed Milk'],
            datasets: [{
                data: [2500, 1800, 700],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(255, 107, 107, 0.7)',
                    'rgba(255, 193, 7, 0.7)'
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(255, 107, 107, 1)',
                    'rgba(255, 193, 7, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    ticks: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ₹${value}`;
                        }
                    }
                }
            }
        }
    });
}

// Update charts for date range
function updateChartsForDateRange(range) {
    // In a real application, this would fetch data for the selected range
    // For now, we'll just reinitialize the charts with sample data
    
    let days = 30; // Default to month
    
    switch(range) {
        case 'today':
            days = 1;
            break;
        case 'week':
            days = 7;
            break;
        case 'month':
            days = 30;
            break;
    }
    
    // Show loading state
    document.querySelectorAll('.chart-container').forEach(container => {
        container.classList.add('loading');
    });
    
    // Simulate data loading delay
    setTimeout(() => {
        initCharts();
        loadSmartStats();
        
        // Remove loading state
        document.querySelectorAll('.chart-container').forEach(container => {
            container.classList.remove('loading');
        });
    }, 800);
}

// Update charts for custom date range
function updateChartsForCustomDateRange(startDate, endDate) {
    // In a real application, this would fetch data for the custom date range
    // For now, we'll just reinitialize the charts with sample data
    
    // Show loading state
    document.querySelectorAll('.chart-container').forEach(container => {
        container.classList.add('loading');
    });
    
    // Simulate data loading delay
    setTimeout(() => {
        initCharts();
        loadSmartStats();
        
        // Remove loading state
        document.querySelectorAll('.chart-container').forEach(container => {
            container.classList.remove('loading');
        });
    }, 800);
}

// Load smart stats
function loadSmartStats() {
    // In a real application, this would calculate stats from actual data
    // For now, we'll just populate with sample data
    
    const statItems = [
        {
            id: 'bestSource',
            value: 'Sharma Dairy',
            detail: 'Best quality and reliability'
        },
        {
            id: 'expensiveSource',
            value: 'City Fresh',
            detail: '₹65/L average price'
        },
        {
            id: 'frequentDays',
            value: 'Weekends',
            detail: '30% more consumption'
        },
        {
            id: 'savingTip',
            value: 'Switch to Gupta Milk',
            detail: 'Save up to ₹300/month'
        }
    ];
    
    statItems.forEach(item => {
        const valueElement = document.getElementById(item.id + 'Value');
        const detailElement = document.getElementById(item.id + 'Detail');
        
        if (valueElement) valueElement.textContent = item.value;
        if (detailElement) detailElement.textContent = item.detail;
    });
}
