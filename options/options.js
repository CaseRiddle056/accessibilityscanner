const apiKeyInput = document.getElementById('apiKey');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');

function showStatus(msg, timeout = 2000) {
  status.textContent = msg;
  if (timeout) setTimeout(() => (status.textContent = ''), timeout);
}

// Load existing key
if (chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get(['pagespeedApiKey'], (data) => {
    if (data?.pagespeedApiKey) apiKeyInput.value = data.pagespeedApiKey;
  });
}

saveBtn.addEventListener('click', () => {
  const val = apiKeyInput.value.trim();
  chrome.storage.sync.set({ pagespeedApiKey: val }, () => {
    showStatus('API key saved');
  });
});

clearBtn.addEventListener('click', () => {
  apiKeyInput.value = '';
  chrome.storage.sync.remove(['pagespeedApiKey'], () => {
    showStatus('API key cleared');
  });
});
