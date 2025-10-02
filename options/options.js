// Handles options/settings page logic
document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const autoScan = document.getElementById('autoScan').checked;
  // Save option to storage
  chrome.storage.sync.set({ autoScan });
  alert('Options saved!');
});
