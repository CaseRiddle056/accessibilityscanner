// Simple PageSpeed Insights helper module
// Exports a single function: runPageSpeedTest(url, apiKey, options)
// Returns parsed JSON results from the API (or throws on error)

async function runPageSpeedTest(targetUrl, apiKey = '', {strategy = 'desktop', maxAttempts = 3} = {}) {
  if (!targetUrl) throw new Error('targetUrl is required');

  const apiEndpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  const buildUrl = (attempt) => {
    const u = new URL(apiEndpoint);
    u.searchParams.set('url', targetUrl);
    u.searchParams.set('strategy', strategy);
    if (apiKey) u.searchParams.set('key', apiKey);
    // Add cache-buster to avoid cached responses when retrying
    if (attempt > 0) u.searchParams.set('_attempt', attempt);
    return u.toString();
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const url = buildUrl(attempt);
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue; // retry
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      return json;
    } catch (err) {
      if (attempt === maxAttempts - 1) throw err;
      // wait before retrying
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Make globally accessible for popup to call via chrome.runtime.getURL and import with dynamic script injection
window.__pagespeed = { runPageSpeedTest };

export { runPageSpeedTest }; // supports bundlers or module-aware environments
