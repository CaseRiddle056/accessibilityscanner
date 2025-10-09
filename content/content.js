// content.js
(async () => {
  // Load axe-core script
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("vendor/axe.min.js");
  script.onload = async () => {
    // Run axe after it loads
    window.axe.run(document, {}, (err, results) => {
      if (err) throw err;

      console.log("Accessibility Violations Found:");
      console.log(results.violations);
    });
  };
  document.head.appendChild(script);
})();
