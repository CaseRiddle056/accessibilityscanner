document.getElementById('scanBtn').addEventListener('click', function() {
    const btn = this;
    const scoreSection = document.querySelector('.score-section');
    const issuesGrid = document.querySelector('.issues-grid');
    const resultsSection = document.querySelector('.results-section');
    
    // Disable button and show loading state
    btn.disabled = true;
    btn.innerHTML = '<span>⟳</span><span>Scanning...</span>';
    
    // Show loading in results section
    resultsSection.innerHTML = '<div class="empty-state">Analyzing page accessibility...</div>';
    
    // Simulate scan (replace with actual axe-core scanning logic)
    setTimeout(() => {
        // Update score
        const score = Math.floor(Math.random() * 40) + 60; // Random score 60-100
        const scoreCircle = scoreSection.querySelector('.score-circle');
        const scoreStatus = scoreSection.querySelector('.score-status');
        
        scoreCircle.textContent = score;
        if (score >= 90) {
            scoreCircle.style.color = '#10b981';
            scoreStatus.textContent = 'Excellent';
            scoreStatus.style.color = '#10b981';
        } else if (score >= 75) {
            scoreCircle.style.color = '#3b82f6';
            scoreStatus.textContent = 'Good';
            scoreStatus.style.color = '#3b82f6';
        } else {
            scoreCircle.style.color = '#f59e0b';
            scoreStatus.textContent = 'Needs Improvement';
            scoreStatus.style.color = '#f59e0b';
        }
        
        // Update issue counts
        const critical = Math.floor(Math.random() * 10);
        const serious = Math.floor(Math.random() * 20);
        const moderate = Math.floor(Math.random() * 30);
        
        issuesGrid.innerHTML = `
            <div class="issue-card critical">
                <div class="issue-number">${critical}</div>
                <div class="issue-label">Critical</div>
            </div>
            <div class="issue-card serious">
                <div class="issue-number">${serious}</div>
                <div class="issue-label">Serious</div>
            </div>
            <div class="issue-card moderate">
                <div class="issue-number">${moderate}</div>
                <div class="issue-label">Moderate</div>
            </div>
        `;
        
        // Sample issues for demo
        const sampleIssues = [
            { severity: 'critical', icon: '🔴', title: 'Missing alt text on images', description: '3 images without alternative text' },
            { severity: 'serious', icon: '🟠', title: 'Insufficient color contrast', description: '5 elements below 4.5:1 ratio' },
            { severity: 'moderate', icon: '🔵', title: 'Form labels missing', description: '2 inputs without associated labels' },
            { severity: 'critical', icon: '🔴', title: 'Keyboard navigation blocked', description: 'Button not focusable via keyboard' },
            { severity: 'serious', icon: '🟠', title: 'Heading structure skipped', description: 'H3 used before H2' },
            { severity: 'moderate', icon: '🔵', title: 'Link text unclear', description: '3 links with generic "click here" text' }
        ];
        
        // Randomly select issues to display
        const displayCount = Math.min(critical + serious + moderate, 6);
        const shuffled = sampleIssues.sort(() => 0.5 - Math.random());
        const selectedIssues = shuffled.slice(0, displayCount);
        
        if (selectedIssues.length > 0) {
            resultsSection.innerHTML = `
                <div class="results-title">
                    📋 Issues Found
                </div>
                ${selectedIssues.map(issue => `
                    <div class="result-item ${issue.severity}">
                        <div class="result-icon">${issue.icon}</div>
                        <div class="result-content">
                            <div class="result-title">${issue.title}</div>
                            <div class="result-description">${issue.description}</div>
                        </div>
                    </div>
                `).join('')}
            `;
        } else {
            resultsSection.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 12px;">✨</div>
                    <div style="font-size: 16px; color: #10b981; font-weight: 600;">No Issues Found!</div>
                    <div style="margin-top: 8px;">This page meets accessibility standards</div>
                </div>
            `;
        }
        
        // Re-enable button
        btn.disabled = false;
        btn.innerHTML = '<span>▶</span><span>Scan Current Page</span>';
    }, 2000);
});

// Initialize with demo data on load
window.addEventListener('DOMContentLoaded', () => {
    console.log('AccessibilityLens loaded - Ready to scan!');
});