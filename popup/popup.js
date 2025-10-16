document.getElementById('scanBtn').addEventListener('click', async function() {
    const btn = this;
    const resultsSection = document.getElementById('results') || document.querySelector('.results-section');
    
    // Disable button and show loading state
    btn.disabled = true;
    btn.innerHTML = '<span>⟳</span><span>Running PageSpeed Test...</span>';
    resultsSection.innerHTML = '<div class="empty-state">Running PageSpeed Insights...</div>';

    try {
        // Get the active tab URL
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs && tabs[0];
        const pageUrl = activeTab?.url || document.getElementById('urlInput')?.value;

        if (!pageUrl) throw new Error('Unable to determine page URL. Open a tab to test or provide a URL.');

        // Ensure pagespeed helper is available (injected as window.__pagespeed)
        async function ensurePagespeedHelper(timeout = 2000) {
            if (window.__pagespeed && typeof window.__pagespeed.runPageSpeedTest === 'function') return true;
            // try injecting script
            try {
                const script = document.createElement('script');
                script.src = chrome.runtime.getURL('lib/pagespeed.js');
                document.head.appendChild(script);
            } catch (e) {
                console.warn('Failed to append pagespeed script tag:', e);
            }

            const interval = 100;
            const start = Date.now();
            while (Date.now() - start < timeout) {
                if (window.__pagespeed && typeof window.__pagespeed.runPageSpeedTest === 'function') return true;
                await new Promise(r => setTimeout(r, interval));
            }
            return !!(window.__pagespeed && typeof window.__pagespeed.runPageSpeedTest === 'function');
        }

    const helperReady = await ensurePagespeedHelper(3000);

        // retrieve stored API key (if any)
        const stored = await new Promise((res) => chrome.storage && chrome.storage.sync && chrome.storage.sync.get(['pagespeedApiKey'], res));
        const apiKey = stored?.pagespeedApiKey || '';

        if (!helperReady) {
            // show friendly fallback and allow a demo run so popup is useful even when helper fails to load
            resultsSection.innerHTML = `
                <div class="empty-state">
                    <div style="font-weight:600; margin-bottom:8px;">Could not load PageSpeed helper</div>
                    <div style="font-size:13px; color:#6b7280; margin-bottom:10px;">You can still run a demo to preview the UI and highlights.</div>
                    <div style="display:flex; gap:8px; justify-content:center;">
                        <button id="demoRunBtn" style="padding:8px 12px; border-radius:6px; background:#1a73e8; color:#fff; border:none;">Run Demo</button>
                        <button id="cancelBtn" style="padding:8px 12px; border-radius:6px; background:#f3f4f6;">Cancel</button>
                    </div>
                </div>
            `;

            document.getElementById('demoRunBtn').addEventListener('click', async () => {
                // build a small demo failingAudits list and reuse highlighting logic
                const demoAudits = [
                    { id: 'demo-missing-alt', title: 'Images missing alt text', help: 'Some images are missing alt text', displayValue: '3 elements' },
                    { id: 'demo-contrast', title: 'Low color contrast', help: 'Elements with insufficient contrast', displayValue: '5 elements' }
                ];

                // show demo results
                const issuesGrid = document.querySelector('.issues-grid');
                if (issuesGrid) {
                    issuesGrid.innerHTML = `
                        <div class="issue-card critical"><div class="issue-number">2</div><div class="issue-label">Failing Audits</div></div>
                        <div class="issue-card serious"><div class="issue-number">0</div><div class="issue-label">Warnings</div></div>
                        <div class="issue-card moderate"><div class="issue-number">0</div><div class="issue-label">Info</div></div>
                    `;
                }

                resultsSection.innerHTML = `
                    <div class="results-title">📋 Demo Failing Accessibility Audits (2)</div>
                    <div class="result-item critical"><div class="result-icon">⚠️</div><div class="result-content"><div class="result-title">Images missing alt text</div><div class="result-description">Some images are missing alt text — 3 elements</div></div></div>
                    <div class="result-item critical"><div class="result-icon">⚠️</div><div class="result-content"><div class="result-title">Low color contrast</div><div class="result-description">Elements with insufficient contrast — 5 elements</div></div></div>
                `;

                // attempt to inject content script and highlight generic selectors for demo
                try {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    const activeTab = tabs && tabs[0];
                    if (activeTab && activeTab.id) {
                        await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ['content/content.js'] });
                        // send a couple of generic selectors that usually match elements
                        chrome.tabs.sendMessage(activeTab.id, { type: 'highlight', highlights: [
                            { selector: 'img:not([alt])', message: 'Missing alt text (demo)', auditId: 'demo-missing-alt' },
                            { selector: 'a', message: 'Sample link (demo)', auditId: 'demo-contrast' }
                        ] }, (resp) => console.log('Demo highlight resp', resp));
                    }
                } catch (e) {
                    console.warn('Demo highlight failed', e);
                }
            });

            document.getElementById('cancelBtn').addEventListener('click', () => {
                resultsSection.innerHTML = '<div class="empty-state">Cancelled.</div>';
            });

            // stop further execution of real API run
            btn.disabled = false;
            btn.innerHTML = '<span>▶</span><span>Scan This Page</span>';
            return;
        }

        // call the helper (guarding against unexpected undefined)
        if (!window.__pagespeed || typeof window.__pagespeed.runPageSpeedTest !== 'function') {
            throw new Error('Pagespeed run function is not available.');
        }

        let json;
        try {
            json = await window.__pagespeed.runPageSpeedTest(pageUrl, apiKey, { strategy: 'desktop' });
        } catch (callErr) {
            throw new Error('PageSpeed API call failed: ' + (callErr && callErr.message ? callErr.message : String(callErr)));
        }

        // --- Accessibility-specific display ---
        const accessibilityCategory = json.lighthouseResult?.categories?.accessibility;
        const accessibilityScore = accessibilityCategory ? Math.round(accessibilityCategory.score * 100) : '--';

        // Update score area
        const scoreCircle = document.querySelector('.score-circle');
        const scoreLabel = document.querySelector('.score-label');
        const scoreStatus = document.querySelector('.score-status');
        const issuesGrid = document.querySelector('.issues-grid');

        if (scoreCircle) scoreCircle.textContent = accessibilityScore;
        if (scoreLabel) scoreLabel.textContent = 'Accessibility Score';

        // Set status text and color
        if (scoreStatus) {
            let statusText = 'Unknown';
            scoreStatus.style.color = '';
            if (accessibilityScore === '--') {
                statusText = 'No Data';
            } else if (accessibilityScore >= 90) {
                statusText = 'Excellent'; scoreStatus.style.color = '#10b981';
            } else if (accessibilityScore >= 50) {
                statusText = 'Good'; scoreStatus.style.color = '#3b82f6';
            } else {
                statusText = 'Needs Improvement'; scoreStatus.style.color = '#f59e0b';
            }
            scoreStatus.textContent = statusText;
        }

        // Populate failing accessibility audits
        const failingAudits = [];
        const auditRefs = accessibilityCategory?.auditRefs || [];
        const audits = json.lighthouseResult?.audits || {};

        auditRefs.forEach(ref => {
            const audit = audits[ref.id];
            if (!audit) return;
            // consider audit failing if score numeric < 1 or score === 0
            const numericScore = typeof audit.score === 'number' ? audit.score : null;
            if (numericScore !== null && numericScore < 1) {
                failingAudits.push({
                    id: ref.id,
                    title: audit.title || ref.id,
                    help: audit.help || audit.description || '',
                    displayValue: audit.displayValue || '',
                    details: audit.details || null
                });
            }
        });

        // Update issues grid counts (simple mapping)
        if (issuesGrid) {
            const failCount = failingAudits.length;
            issuesGrid.innerHTML = `
                <div class="issue-card critical">
                    <div class="issue-number">${failCount}</div>
                    <div class="issue-label">Failing Audits</div>
                </div>
                <div class="issue-card serious">
                    <div class="issue-number">0</div>
                    <div class="issue-label">Warnings</div>
                </div>
                <div class="issue-card moderate">
                    <div class="issue-number">0</div>
                    <div class="issue-label">Info</div>
                </div>
            `;
        }

    if (resultsSection) {
            if (failingAudits.length === 0) {
                resultsSection.innerHTML = `
                    <div class="empty-state">
                        <div style="font-size: 36px; margin-bottom: 8px;">✅</div>
                        <div style="font-size: 14px; color: #10b981; font-weight: 600;">No Accessibility Issues Found</div>
                        <div style="margin-top: 6px;">This page meets common accessibility checks from Lighthouse.</div>
                    </div>
                `;
            } else {
                resultsSection.innerHTML = `
                    <div class="results-title">📋 Failing Accessibility Audits (${failingAudits.length})</div>
                    ${failingAudits.map(a => `
                        <div class="result-item critical">
                            <div class="result-icon">⚠️</div>
                            <div class="result-content">
                                <div class="result-title">${a.title}</div>
                                <div class="result-description">${a.help} ${a.displayValue ? ' — ' + a.displayValue : ''}</div>
                            </div>
                        </div>
                    `).join('')}
                `;
            }
        }
        // --- Send highlights to active tab ---
        try {
            const highlights = [];
            // collect selectors from failing audits' details
            failingAudits.forEach(a => {
                const audit = json.lighthouseResult?.audits?.[a.id];
                if (!audit) return;
                const details = audit.details;
                if (details && details.items) {
                    details.items.forEach(item => {
                        // nodes may be attached directly or under item.nodes
                        if (item.node) {
                            if (item.node.selector) highlights.push({ selector: item.node.selector, message: a.title, auditId: a.id });
                        }
                        if (Array.isArray(item.nodes)) {
                            item.nodes.forEach(n => {
                                if (n.selector) highlights.push({ selector: n.selector, message: a.title, auditId: a.id });
                            });
                        }
                        // some items may have a 'selector' or 'target'
                        if (item.selector) highlights.push({ selector: item.selector, message: a.title, auditId: a.id });
                        if (item.target) {
                            // target can be an array of selectors
                            if (Array.isArray(item.target)) item.target.forEach(t => highlights.push({ selector: t, message: a.title, auditId: a.id }));
                            else if (typeof item.target === 'string') highlights.push({ selector: item.target, message: a.title, auditId: a.id });
                        }
                    });
                }
            });

            if (highlights.length > 0) {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                const activeTab = tabs && tabs[0];
                if (activeTab && activeTab.id) {
                    try {
                        // Inject content script into the page before messaging (safe in many contexts)
                        await chrome.scripting.executeScript({
                            target: { tabId: activeTab.id },
                            files: ['content/content.js']
                        });
                    } catch (injectErr) {
                        console.warn('Could not inject content script:', injectErr);
                    }

                    chrome.tabs.sendMessage(activeTab.id, { type: 'highlight', highlights }, (resp) => {
                        console.log('Highlight response', resp);
                    });
                }
            } else {
                // clear any previous highlights
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                const activeTab = tabs && tabs[0];
                if (activeTab && activeTab.id) {
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: activeTab.id },
                            files: ['content/content.js']
                        });
                    } catch (injectErr) {
                        console.warn('Could not inject content script for clearing highlights:', injectErr);
                    }
                    chrome.tabs.sendMessage(activeTab.id, { type: 'clear-highlights' }, (resp) => {
                        console.log('Clear highlights response', resp);
                    });
                }
            }
        } catch (err) {
            console.warn('Failed to send highlights:', err);
        }

    } catch (err) {
        console.error('PageSpeed test failed:', err);
        const resultsSection = document.getElementById('results') || document.querySelector('.results-section');
        resultsSection.innerHTML = `<div class="error">Error: ${err.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>▶</span><span>Scan This Page</span>';
    }
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Popup ready - PageSpeed integration available.');
    // populate API key input if previously saved
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveBtn = document.getElementById('saveApiKeyBtn');
    if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['pagespeedApiKey'], (data) => {
            if (data?.pagespeedApiKey) apiKeyInput.value = data.pagespeedApiKey;
        });
    }

    saveBtn.addEventListener('click', () => {
        const val = apiKeyInput.value.trim();
        chrome.storage.sync.set({ pagespeedApiKey: val }, () => {
            // simple feedback
            saveBtn.textContent = 'Saved';
            setTimeout(() => (saveBtn.textContent = 'Save'), 1200);
        });
    });
    // show global errors in the results area
    window.addEventListener('error', (e) => {
        const resultsSection = document.getElementById('results') || document.querySelector('.results-section');
        if (resultsSection) resultsSection.innerHTML = `<div class="error">Error: ${e.message || String(e.error || e)}</div>`;
    });
    window.addEventListener('unhandledrejection', (ev) => {
        const resultsSection = document.getElementById('results') || document.querySelector('.results-section');
        if (resultsSection) resultsSection.innerHTML = `<div class="error">Unhandled: ${ev.reason?.message || String(ev.reason)}</div>`;
    });
});