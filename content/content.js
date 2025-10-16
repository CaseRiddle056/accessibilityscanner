// content.js
// Content script now listens for highlight messages from the popup and draws overlays
if (window.__as_injected) {
	console.log('Accessibility content script already injected.');
} else {
	window.__as_injected = true;
	console.log('Content script loaded. Ready to highlight accessibility issues.');

  

const __as_overlays = [];

function clearHighlights() {
	while (__as_overlays.length) {
		const el = __as_overlays.pop();
		if (el && el.remove) el.remove();
	}
	const injectedStyle = document.getElementById('__as_injected_style');
	if (injectedStyle) injectedStyle.remove();
}

function injectStyles() {
	if (document.getElementById('__as_injected_style')) return;
	const style = document.createElement('style');
	style.id = '__as_injected_style';
	style.textContent = `
		.as-overlay-label { font: 12px/1.2 system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background: rgba(26,115,232,0.95); color: #fff; padding: 4px 6px; border-radius: 6px; position: absolute; z-index: 2147483648; pointer-events: none; }
		.as-overlay-box { position: absolute; border: 3px solid rgba(255,69,58,0.95); background: rgba(255,69,58,0.06); z-index: 2147483647; pointer-events: none; box-sizing: border-box; border-radius:6px; }
	`;
	document.head.appendChild(style);
}

function highlightElement(el, message) {
	try {
		const rect = el.getBoundingClientRect();
		injectStyles();
		const box = document.createElement('div');
		box.className = 'as-overlay-box';
		box.style.left = (rect.left + window.scrollX) + 'px';
		box.style.top = (rect.top + window.scrollY) + 'px';
		box.style.width = rect.width + 'px';
		box.style.height = rect.height + 'px';

		const label = document.createElement('div');
		label.className = 'as-overlay-label';
		label.textContent = message || 'Accessibility issue';
		// position label above box when possible
		label.style.left = (rect.left + window.scrollX) + 'px';
		label.style.top = Math.max((rect.top + window.scrollY) - 26, 0) + 'px';

		document.body.appendChild(box);
		document.body.appendChild(label);
		__as_overlays.push(box, label);
	} catch (e) {
		console.warn('Highlight failed for element', e);
	}
}

function createFloatingNote(message) {
	injectStyles();
	const wrapper = document.createElement('div');
	wrapper.className = 'as-overlay-label';
	wrapper.style.position = 'fixed';
	wrapper.style.top = '8px';
	wrapper.style.right = '8px';
	wrapper.style.zIndex = '2147483649';
	wrapper.textContent = message;
	document.body.appendChild(wrapper);
	__as_overlays.push(wrapper);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (!msg || !msg.type) return;
	if (msg.type === 'clear-highlights') {
		clearHighlights();
		sendResponse({ ok: true });
		return;
	}

	if (msg.type === 'highlight' && Array.isArray(msg.highlights)) {
		try {
			clearHighlights();
			let totalMatched = 0;
			msg.highlights.slice(0, 25).forEach(h => {
				const sel = (h.selector || '').trim();
				const msgText = h.message || h.auditId || 'Accessibility issue';
				if (!sel) return;
				let elements = [];
				try {
					elements = Array.from(document.querySelectorAll(sel)).slice(0, 5);
				} catch (e) {
					// invalid selector — skip
					return;
				}

				if (elements.length === 0) {
					// nothing matched — note it
					createFloatingNote(`No elements match selector: ${sel}`);
				} else {
					totalMatched += elements.length;
					elements.forEach(el => highlightElement(el, msgText));
				}
			});

			if (totalMatched === 0) {
				createFloatingNote('No elements highlighted (selectors not found).');
			}

			sendResponse({ ok: true, matched: totalMatched });
		} catch (err) {
			console.error('Highlight handler failed:', err);
			sendResponse({ ok: false, error: String(err) });
		}
	}
});
}
