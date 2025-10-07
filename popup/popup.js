document.getElementById('scanBtn').addEventListener('click', function() {
    const resultsDiv = document.getElementById('results');
    const btn = this;
    
    // Disable button and show loading state
    btn.disabled = true;
    btn.innerHTML = '<span>⟳</span><span>Scanning...</span>';
    resultsDiv.innerHTML = '<div class="loading-spinner"></div>';
    resultsDiv.classList.add('has-content');
    
    // Simulate scan (replace with actual axe-core scanning logic)
    setTimeout(() => {
        resultsDiv.innerHTML = `
            <div style="text-align: left; width: 100%;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; background: #e8f5e0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">✓</div>
                    <div>
                        <h3 style="color: #2d5016; margin: 0; font-size: 1.1rem;">Scan Complete</h3>
                        <p style="color: #6b8e5a; margin: 0; font-size: 0.85rem;">Analysis ready for review</p>
                    </div>
                </div>
                <div class="wcag-badge">
                    <span>📋</span>
                    <span>Integrated with axe-core</span>
                </div>
            </div>
        `;
        
        // Re-enable button
        btn.disabled = false;
        btn.innerHTML = '<span>▶</span><span>Scan Current Page</span>';
    }, 2000);
});