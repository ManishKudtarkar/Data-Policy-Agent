// ============================================
// COMPLIANCE AGENT - ENHANCED JAVASCRIPT
// Modern UI with Advanced Features
// ============================================

const API_BASE_URL = 'http://localhost:8000';

// State
let selectedFile = null;
let auditResults = null;
let processingStartTime = null;
let auditCount = 0;
let totalViolationsCount = 0;

// DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const selectFileBtn = document.getElementById('select-file-btn');
const selectedFileDiv = document.getElementById('selected-file');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const removeFileBtn = document.getElementById('remove-file-btn');
const auditBtn = document.getElementById('audit-btn');
const auditBtnText = document.getElementById('audit-btn-text');
const spinner = document.getElementById('spinner');
const resultsSection = document.getElementById('results-section');
const statusIndicator = document.getElementById('status-indicator');
const apiStatus = document.getElementById('api-status');
const policyNameEl = document.getElementById('policy-name');
const totalViolationsEl = document.getElementById('total-violations');
const scanStatusEl = document.getElementById('scan-status');
const violationsContainer = document.getElementById('violations-container');
const downloadReportBtn = document.getElementById('download-report-btn');
const printReportBtn = document.getElementById('print-report-btn');
const themeToggle = document.getElementById('theme-toggle');
const toast = document.getElementById('toast');
const toastClose = document.getElementById('toast-close');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const processingTimeEl = document.getElementById('processing-time');
const statsBar = document.getElementById('stats-bar');
const totalAuditsEl = document.getElementById('total-audits');
const totalViolationsStatEl = document.getElementById('total-violations-stat');
const lastScanTimeEl = document.getElementById('last-scan-time');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAPIStatus();
    setupEventListeners();
    loadStats();
    animateOnScroll();
});

// ===== API STATUS =====
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();
        
        if (data.status === 'online') {
            statusIndicator.classList.add('online');
            apiStatus.textContent = 'Online';
            showToast('success', 'Connected', 'API is online and ready');
        } else {
            throw new Error('API offline');
        }
    } catch (error) {
        statusIndicator.classList.add('offline');
        apiStatus.textContent = 'Offline';
        showToast('error', 'Disconnected', 'API is currently offline');
        console.error('API Status Error:', error);
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Upload
    uploadArea.addEventListener('click', () => fileInput.click());
    selectFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag & Drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Actions
    removeFileBtn.addEventListener('click', removeFile);
    auditBtn.addEventListener('click', performAudit);
    downloadReportBtn.addEventListener('click', downloadReport);
    if (printReportBtn) printReportBtn.addEventListener('click', printReport);
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (toastClose) toastClose.addEventListener('click', hideToast);
    
    // Filter Tabs
    const filterTabs = document.querySelectorAll('.tab-btn');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => filterResults(tab.dataset.filter));
    });
}

// ===== FILE HANDLING =====
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) validateAndSetFile(file);
}

function validateAndSetFile(file) {
    const validTypes = ['application/pdf', 'text/plain'];
    const validExtensions = ['.pdf', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        showToast('error', 'Invalid File', 'Please upload a PDF or TXT file');
        return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('error', 'File Too Large', 'Maximum size is 10MB');
        return;
    }

    selectedFile = file;
    displaySelectedFile(file);
    auditBtn.disabled = false;
    showToast('success', 'File Selected', `${file.name} is ready to audit`);
}

function displaySelectedFile(file) {
    uploadArea.style.display = 'none';
    selectedFileDiv.style.display = 'block';
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function removeFile() {
    selectedFile = null;
    fileInput.value = '';
    uploadArea.style.display = 'block';
    selectedFileDiv.style.display = 'none';
    auditBtn.disabled = true;
    resultsSection.style.display = 'none';
    progressSection.style.display = 'none';
    showToast('success', 'File Removed', 'You can upload a new file');
}

// ===== DRAG & DROP =====
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    if (file) {
        fileInput.files = event.dataTransfer.files;
        validateAndSetFile(file);
    }
}

// ===== AUDIT PROCESS =====
async function performAudit() {
    if (!selectedFile) return;

    processingStartTime = Date.now();
    
    // Update UI
    auditBtn.disabled = true;
    auditBtnText.textContent = 'Processing...';
    spinner.style.display = 'block';
    progressSection.style.display = 'block';
    
    // Animate progress
    animateProgress();

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
        const response = await fetch(`${API_BASE_URL}/audit`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        auditResults = data;
        
        // Calculate processing time
        const processingTime = ((Date.now() - processingStartTime) / 1000).toFixed(2);
        
        displayResults(data, processingTime);
        updateStats(data);
        
        // Success feedback
        auditBtnText.textContent = 'Audit Complete ✓';
        showToast('success', 'Audit Complete', `Found ${data.total_violations} violations in ${processingTime}s`);
        
        setTimeout(() => {
            auditBtnText.textContent = 'Run Compliance Audit';
            auditBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Audit Error:', error);
        showToast('error', 'Audit Failed', 'An error occurred. Please try again.');
        auditBtnText.textContent = 'Run Compliance Audit';
        auditBtn.disabled = false;
    } finally {
        spinner.style.display = 'none';
        progressSection.style.display = 'none';
    }
}

function animateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        progressFill.style.width = progress + '%';
        progressText.textContent = `Processing... ${Math.round(progress)}%`;
    }, 200);
    
    // Complete when audit finishes
    setTimeout(() => {
        clearInterval(interval);
        progressFill.style.width = '100%';
        progressText.textContent = 'Complete!';
    }, 1000);
}

// ===== DISPLAY RESULTS =====
function displayResults(data, processingTime) {
    resultsSection.style.display = 'block';
    statsBar.style.display = 'grid';
    
    // Update summary
    policyNameEl.textContent = data.policy_name;
    totalViolationsEl.textContent = data.total_violations;
    scanStatusEl.textContent = 'Completed';
    processingTimeEl.textContent = processingTime + 's';

    // Display violations
    violationsContainer.innerHTML = '';
    
    if (data.violations && data.violations.length > 0) {
        data.violations.forEach((violation, index) => {
            const card = createViolationCard(violation, index + 1);
            violationsContainer.appendChild(card);
        });
    } else {
        violationsContainer.innerHTML = `
            <div class="no-violations">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" stroke-width="2"/>
                </svg>
                <h3>No Violations Found</h3>
                <p>The policy audit completed successfully with no compliance violations detected.</p>
            </div>
        `;
    }

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createViolationCard(violation, index) {
    const card = document.createElement('div');
    card.className = 'violation-card';
    card.dataset.type = 'violation';
    
    card.innerHTML = `
        <div class="violation-header">
            <div class="violation-title">
                <h3>Violation #${index}</h3>
                <span class="violation-badge">${escapeHtml(violation.event_type)}</span>
            </div>
            <div class="violation-value">Value: ${violation.val.toFixed(2)}</div>
        </div>
        <p class="violation-reason">${escapeHtml(violation.reason)}</p>
        <div class="violation-footer">
            <span class="violation-source"><strong>Subject ID:</strong> ${escapeHtml(violation.subject_id)}</span>
            <span class="violation-source"><strong>Source:</strong> ${escapeHtml(violation.source)}</span>
        </div>
    `;
    
    // Animate in
    setTimeout(() => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    }, 0);
    
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== FILTER RESULTS =====
function filterResults(filter) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // Filter cards
    const cards = document.querySelectorAll('.violation-card');
    cards.forEach(card => {
        if (filter === 'all') {
            card.style.display = 'block';
        } else if (filter === 'violations') {
            card.style.display = card.dataset.type === 'violation' ? 'block' : 'none';
        } else if (filter === 'compliant') {
            card.style.display = card.dataset.type === 'compliant' ? 'block' : 'none';
        }
    });
}

// ===== STATS & TRACKING =====
function updateStats(data) {
    auditCount++;
    totalViolationsCount += data.total_violations;
    
    totalAuditsEl.textContent = auditCount;
    totalViolationsStatEl.textContent = totalViolationsCount;
    lastScanTimeEl.textContent = new Date().toLocaleTimeString();
    
    saveStats();
}

function loadStats() {
    const stats = JSON.parse(localStorage.getItem('auditStats') || '{}');
    auditCount = stats.auditCount || 0;
    totalViolationsCount = stats.totalViolations || 0;
    
    if (auditCount > 0) {
        statsBar.style.display = 'grid';
        totalAuditsEl.textContent = auditCount;
        totalViolationsStatEl.textContent = totalViolationsCount;
        lastScanTimeEl.textContent = stats.lastScanTime || '--';
    }
}

function saveStats() {
    localStorage.setItem('auditStats', JSON.stringify({
        auditCount,
        totalViolations: totalViolationsCount,
        lastScanTime: new Date().toLocaleTimeString()
    }));
}

// ===== DOWNLOAD REPORT =====
function downloadReport() {
    if (!auditResults) return;

    const content = generateReportContent(auditResults);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('success', 'Report Downloaded', 'Your audit report has been saved');
}

function generateReportContent(data) {
    let content = '='.repeat(70) + '\n';
    content += '          COMPLIANCE AUDIT REPORT\n';
    content += '='.repeat(70) + '\n\n';
    
    content += `Policy Document:    ${data.policy_name}\n`;
    content += `Date & Time:        ${new Date().toLocaleString()}\n`;
    content += `Total Violations:   ${data.total_violations}\n`;
    content += `Status:             Completed\n`;
    content += '\n' + '='.repeat(70) + '\n\n';
    
    if (data.violations && data.violations.length > 0) {
        content += 'VIOLATIONS DETECTED:\n\n';
        
        data.violations.forEach((violation, index) => {
            content += `${index + 1}. ${violation.event_type}\n`;
            content += `   ${'─'.repeat(65)}\n`;
            content += `   Subject ID:  ${violation.subject_id}\n`;
            content += `   Value:       ${violation.val.toFixed(2)}\n`;
            content += `   Reason:      ${violation.reason}\n`;
            content += `   Source:      ${violation.source}\n`;
            content += '\n';
        });
    } else {
        content += 'No violations found. All compliance checks passed.\n\n';
    }
    
    content += '='.repeat(70) + '\n';
    content += 'End of Report - Generated by Compliance Agent\n';
    content += '='.repeat(70) + '\n';
    
    return content;
}

// ===== PRINT REPORT =====
function printReport() {
    window.print();
    showToast('success', 'Print', 'Opening print dialog...');
}

// ===== TOAST NOTIFICATIONS =====
function showToast(type, title, message) {
    const toastIcon = document.getElementById('toast-icon');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    
    toast.className = `toast ${type}`;
    toastIcon.innerHTML = type === 'success' ? '✓' : '✕';
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(hideToast, 4000);
}

function hideToast() {
    toast.classList.remove('show');
}

// ===== THEME TOGGLE =====
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    showToast('success', 'Theme Changed', `Switched to ${isDark ? 'dark' : 'light'} mode`);
}

// ===== ANIMATIONS =====
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.summary-card, .violation-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// ===== PERIODIC API CHECK =====
setInterval(checkAPIStatus, 30000); // Every 30 seconds

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showToast('error', 'Error', 'An unexpected error occurred');
});

// ===== LOAD THEME ON START =====
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}
