/* AetherStudio settings panel and local preferences. */
(() => {
    'use strict';

    const STORAGE_KEY = 'aetherstudio-preferences';
    const DB_NAME = 'aetherstudio-library';
    const styles = `
        .aether-settings-launcher{position:fixed;left:20px;bottom:20px;z-index:40;display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid #52525b;border-radius:14px;background:#27272a;color:#f4f4f5;font:600 13px Inter,sans-serif;cursor:pointer;box-shadow:0 10px 30px #0005;transition:transform .2s,background .2s}
        .aether-settings-launcher:hover{background:#3f3f46;transform:translateY(-2px)}
        .aether-settings-launcher:focus-visible,.aether-settings-close:focus-visible,.aether-theme-toggle:focus-visible,.aether-settings-control:focus-visible,.aether-settings-action:focus-visible{outline:2px solid #22d3ee;outline-offset:3px}
        .aether-settings-backdrop{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:20px;background:rgb(0 0 0 / 68%);backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:opacity .2s,visibility .2s}
        .aether-settings-backdrop.is-open{opacity:1;visibility:visible}
        .aether-settings-window{width:min(560px,100%);max-height:min(85vh,760px);overflow:auto;border:1px solid #3f3f46;border-radius:18px;background:#16161d;color:#f4f4f5;box-shadow:0 24px 80px #0009;transform:translateY(8px) scale(.99);opacity:0;transition:transform .2s,opacity .2s}
        .aether-settings-backdrop.is-open .aether-settings-window{transform:translateY(0) scale(1);opacity:1}
        .aether-settings-titlebar{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#101014;border-bottom:1px solid #2a2a38}
        .aether-settings-dots{display:flex;gap:7px}.aether-settings-dots i{width:9px;height:9px;border-radius:50%;background:#52525b}.aether-settings-dots i:first-child{background:#fb7185}.aether-settings-dots i:nth-child(2){background:#fbbf24}.aether-settings-dots i:nth-child(3){background:#34d399}
        .aether-settings-close{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:9px;background:#27272a;color:#d4d4d8;font-size:20px;cursor:pointer}
        .aether-settings-content{padding:22px}.aether-settings-content h2{margin:0 0 6px;font:600 20px Inter,sans-serif}.aether-settings-intro{margin:0 0 18px;color:#a1a1aa;font:14px/1.5 Inter,sans-serif}
        .aether-settings-section{margin-top:20px}.aether-settings-section h3{margin:0 0 9px;color:#22d3ee;font:600 11px Inter,sans-serif;text-transform:uppercase;letter-spacing:.1em}
        .aether-settings-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:8px;padding:13px;border:1px solid #2a2a38;border-radius:12px;background:#1e1e28;font:13px Inter,sans-serif}
        .aether-settings-row strong{display:block;color:#f4f4f5;font-weight:600}.aether-settings-row small{display:block;margin-top:4px;color:#a1a1aa;line-height:1.4}
        .aether-settings-control{max-width:180px;padding:8px 10px;border:1px solid #52525b;border-radius:9px;background:#101014;color:#f4f4f5;font:12px Inter,sans-serif}
        .aether-theme-toggle{position:relative;width:44px;height:24px;flex:none;padding:0;border:0;border-radius:999px;background:#52525b;cursor:pointer;transition:background .2s}
        .aether-theme-toggle:after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s}
        .aether-theme-toggle[aria-checked="true"]{background:#0891b2}.aether-theme-toggle[aria-checked="true"]:after{transform:translateX(20px)}
        .aether-settings-action{padding:8px 11px;border:1px solid #52525b;border-radius:9px;background:#27272a;color:#e4e4e7;font:600 12px Inter,sans-serif;cursor:pointer}.aether-settings-action:hover{background:#3f3f46}
        .aether-settings-action.danger{border-color:#9f1239;background:#4c0519;color:#fecdd3}.aether-settings-action.danger:hover{background:#881337}
        .aether-settings-hint{margin:10px 2px 0;color:#71717a;font:11px/1.5 Inter,sans-serif}
        .aether-settings-confirm{position:fixed;inset:0;z-index:70;display:none;place-items:center;padding:20px;background:#000a}.aether-settings-confirm.is-open{display:grid}.aether-settings-confirm-box{width:min(400px,100%);padding:20px;border:1px solid #52525b;border-radius:14px;background:#16161d;color:#f4f4f5;font:14px/1.5 Inter,sans-serif;box-shadow:0 20px 60px #0009}.aether-settings-confirm-box p{color:#a1a1aa}.aether-settings-confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
        html:not(.dark) body{background:#f4f6f8!important;color:#18181b!important;color-scheme:light}
        html:not(.dark) [class~="bg-studio-950"]{background-color:#f4f6f8!important}html:not(.dark) [class~="bg-studio-900"]{background-color:#fff!important}html:not(.dark) [class~="bg-studio-850"]{background-color:#f1f3f5!important}html:not(.dark) [class~="bg-studio-800"]{background-color:#e4e7eb!important}html:not(.dark) [class~="bg-studio-700"]{background-color:#d1d5db!important}
        html:not(.dark) [class~="bg-studio-950/60"],html:not(.dark) [class~="bg-studio-950/70"]{background-color:#eef0f3!important}html:not(.dark) [class~="bg-studio-850/70"]{background-color:#f1f3f5!important}html:not(.dark) [class~="bg-studio-900/90"]{background-color:rgb(255 255 255 / 92%)!important}
        html:not(.dark) [class~="text-white"],html:not(.dark) [class~="text-zinc-100"],html:not(.dark) [class~="text-zinc-200"]{color:#18181b!important}html:not(.dark) [class~="text-zinc-300"]{color:#3f3f46!important}html:not(.dark) [class~="text-zinc-400"],html:not(.dark) [class~="text-zinc-500"]{color:#52525b!important}
        html:not(.dark) [class~="border-studio-800"],html:not(.dark) [class~="border-studio-800/80"],html:not(.dark) [class~="border-studio-800/90"],html:not(.dark) [class~="border-studio-700"]{border-color:#d1d5db!important}
        html:not(.dark) [class~="bg-black/75"]{background-color:rgb(24 24 27 / 42%)!important}
        html:not(.dark) .aether-settings-titlebar{background:#f1f3f5;border-color:#d4d7dc}html:not(.dark) .aether-settings-window,html:not(.dark) .aether-settings-confirm-box{background:#fff;color:#18181b;border-color:#d4d7dc}html:not(.dark) .aether-settings-close,html:not(.dark) .aether-settings-row,html:not(.dark) .aether-settings-control{background:#f1f3f5;color:#27272a;border-color:#d4d7dc}html:not(.dark) .aether-settings-row strong{color:#18181b}html:not(.dark) .aether-settings-content p,html:not(.dark) .aether-settings-row small{color:#52525b}html:not(.dark) .aether-settings-launcher{background:#d1d5db;color:#18181b;border-color:#a1a1aa}
        @media(prefers-reduced-motion:reduce){.aether-settings-launcher,.aether-settings-backdrop,.aether-settings-window,.aether-theme-toggle,.aether-theme-toggle:after{transition:none!important}}
        html.aether-reduced-motion *,html.aether-reduced-motion *:before,html.aether-reduced-motion *:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
    `;

    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);

    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'aether-settings-launcher';
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Open studio settings');
    launcher.innerHTML = '<span aria-hidden="true">⚙</span><span>Settings</span>';

    const backdrop = document.createElement('div');
    backdrop.className = 'aether-settings-backdrop';
    backdrop.innerHTML = `
        <section class="aether-settings-window" role="dialog" aria-modal="true" aria-labelledby="aether-settings-heading">
            <header class="aether-settings-titlebar"><div class="aether-settings-dots" aria-hidden="true"><i></i><i></i><i></i></div><span style="color:#a1a1aa;font:12px Inter,sans-serif">AetherStudio Preferences</span><button type="button" class="aether-settings-close" aria-label="Close settings">×</button></header>
            <div class="aether-settings-content">
                <h2 id="aether-settings-heading">Settings</h2><p class="aether-settings-intro">Personalize your studio experience. Preferences are saved in this browser.</p>
                <div class="aether-settings-section"><h3>Appearance & accessibility</h3>
                    <div class="aether-settings-row"><div><strong>Light theme</strong><small id="aether-theme-description">Currently using dark theme</small></div><button type="button" class="aether-theme-toggle" role="switch" aria-checked="false" aria-label="Enable light theme"></button></div>
                    <div class="aether-settings-row"><div><strong>Reduce motion</strong><small>Limit decorative animation and transitions.</small></div><button type="button" id="aether-motion-toggle" class="aether-theme-toggle" role="switch" aria-checked="false" aria-label="Enable reduced motion"></button></div>
                </div>
                <div class="aether-settings-section"><h3>Playback</h3>
                    <div class="aether-settings-row"><div><strong>Visualizer</strong><small>Choose the display used by the audio deck.</small></div><select id="aether-visualizer" class="aether-settings-control" aria-label="Visualizer style"><option value="bars">Spectrum bars</option><option value="wave">Waveform</option><option value="mirror">Dual mirror</option></select></div>
                    <div class="aether-settings-row"><div><strong>Track crossfade</strong><small>Default transition duration between tracks.</small></div><select id="aether-crossfade" class="aether-settings-control" aria-label="Track crossfade"><option value="0">Off</option><option value="1">1 second</option><option value="2">2 seconds</option><option value="3">3 seconds</option><option value="4">4 seconds</option><option value="5">5 seconds</option><option value="6">6 seconds</option><option value="7">7 seconds</option><option value="8">8 seconds</option></select></div>
                </div>
                <div class="aether-settings-section"><h3>Local music library</h3>
                    <div class="aether-settings-row"><div><strong>Browser storage</strong><small id="aether-storage-usage">Checking local storage…</small></div><button type="button" id="aether-refresh-storage" class="aether-settings-action">Refresh</button></div>
                    <div class="aether-settings-row"><div><strong>Clear saved library</strong><small>Remove uploaded tracks and playlists saved in this browser.</small></div><button type="button" id="aether-clear-library" class="aether-settings-action danger">Clear data</button></div>
                    <p class="aether-settings-hint">Your music is stored locally in this browser and is not uploaded to a server. Clearing browser site data also removes this library.</p>
                </div>
                <div class="aether-settings-section"><h3>Keyboard shortcut</h3><div class="aether-settings-row"><div><strong>Open or close settings</strong><small>Use Ctrl+, (Windows/Linux) or ⌘+, (Mac).</small></div></div></div>
            </div>
        </section>`;

    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'aether-settings-confirm';
    confirmDialog.innerHTML = '<section class="aether-settings-confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="aether-clear-heading"><strong id="aether-clear-heading">Clear saved music?</strong><p>This permanently removes all uploaded audio and playlists stored by AetherStudio in this browser. This cannot be undone.</p><div class="aether-settings-confirm-actions"><button type="button" class="aether-settings-action" data-clear-cancel>Cancel</button><button type="button" class="aether-settings-action danger" data-clear-confirm>Clear library</button></div></section>';
    document.body.append(launcher, backdrop, confirmDialog);

    const closeButton = backdrop.querySelector('.aether-settings-close');
    const themeToggle = backdrop.querySelector('.aether-theme-toggle');
    const themeDescription = backdrop.querySelector('#aether-theme-description');
    const motionToggle = backdrop.querySelector('#aether-motion-toggle');
    const visualizerSelect = backdrop.querySelector('#aether-visualizer');
    const crossfadeSelect = backdrop.querySelector('#aether-crossfade');
    const storageUsage = backdrop.querySelector('#aether-storage-usage');
    let previousFocus = null;

    function readPreferences() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) { return {}; }
    }

    function savePreference(key, value) {
        const preferences = readPreferences();
        preferences[key] = value;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch (_) { }
    }

    function setTheme(isLight) {
        document.documentElement.classList.toggle('dark', !isLight);
        document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
        themeToggle.setAttribute('aria-checked', String(isLight));
        themeToggle.setAttribute('aria-label', isLight ? 'Disable light theme' : 'Enable light theme');
        themeDescription.textContent = `Currently using ${isLight ? 'light' : 'dark'} theme`;
        try { localStorage.setItem('aetherstudio-theme', isLight ? 'light' : 'dark'); } catch (_) { }
    }

    function setReducedMotion(enabled) {
        document.documentElement.classList.toggle('aether-reduced-motion', enabled);
        motionToggle.setAttribute('aria-checked', String(enabled));
        motionToggle.setAttribute('aria-label', enabled ? 'Disable reduced motion' : 'Enable reduced motion');
        savePreference('reducedMotion', enabled);
    }

    function setVisualizer(mode, persist = true) {
        if (!['bars', 'wave', 'mirror'].includes(mode)) mode = 'bars';
        visualizerSelect.value = mode;
        const button = document.querySelector(`.viz-mode-btn[data-viz="${mode}"]`);
        if (button) button.click();
        if (persist) savePreference('visualizer', mode);
    }

    function setCrossfade(seconds, persist = true) {
        const value = String(Math.max(0, Math.min(8, Number(seconds) || 0)));
        crossfadeSelect.value = value;
        const slider = document.getElementById('crossfade-slider');
        if (slider) {
            slider.value = value;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (persist) savePreference('crossfade', value);
    }

    async function refreshStorageUsage() {
        if (!navigator.storage || !navigator.storage.estimate) {
            storageUsage.textContent = 'Storage estimate is not available in this browser.';
            return;
        }
        try {
            const estimate = await navigator.storage.estimate();
            const used = Number(estimate.usage) || 0;
            const quota = Number(estimate.quota) || 0;
            const formatBytes = bytes => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
            storageUsage.textContent = quota ? `${formatBytes(used)} used · ${formatBytes(quota)} available` : `${formatBytes(used)} used`;
        } catch (_) {
            storageUsage.textContent = 'Could not read browser storage usage.';
        }
    }

    function openSettings() {
        previousFocus = document.activeElement;
        backdrop.classList.add('is-open');
        launcher.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        closeButton.focus();
        refreshStorageUsage();
    }

    function closeSettings() {
        backdrop.classList.remove('is-open');
        launcher.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    }

    launcher.addEventListener('click', openSettings);
    closeButton.addEventListener('click', closeSettings);
    backdrop.addEventListener('click', event => { if (event.target === backdrop) closeSettings(); });
    themeToggle.addEventListener('click', () => setTheme(themeToggle.getAttribute('aria-checked') !== 'true'));
    motionToggle.addEventListener('click', () => setReducedMotion(motionToggle.getAttribute('aria-checked') !== 'true'));
    visualizerSelect.addEventListener('change', () => setVisualizer(visualizerSelect.value));
    crossfadeSelect.addEventListener('change', () => setCrossfade(crossfadeSelect.value));
    backdrop.querySelector('#aether-refresh-storage').addEventListener('click', refreshStorageUsage);

    backdrop.querySelector('#aether-clear-library').addEventListener('click', () => {
        confirmDialog.classList.add('is-open');
        confirmDialog.querySelector('[data-clear-cancel]').focus();
    });
    confirmDialog.querySelector('[data-clear-cancel]').addEventListener('click', () => {
        confirmDialog.classList.remove('is-open');
        backdrop.querySelector('#aether-clear-library').focus();
    });
    confirmDialog.addEventListener('click', event => {
        if (event.target === confirmDialog) confirmDialog.classList.remove('is-open');
    });
    confirmDialog.querySelector('[data-clear-confirm]').addEventListener('click', () => {
        const button = confirmDialog.querySelector('[data-clear-confirm]');
        button.disabled = true;
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => window.location.reload();
        request.onerror = () => {
            button.disabled = false;
            storageUsage.textContent = 'Could not clear the library. Close other AetherStudio tabs and try again.';
            confirmDialog.classList.remove('is-open');
        };
        request.onblocked = () => {
            button.disabled = false;
            storageUsage.textContent = 'Close other AetherStudio tabs before clearing the library.';
            confirmDialog.classList.remove('is-open');
        };
    });

    document.addEventListener('keydown', event => {
        const isShortcut = (event.ctrlKey || event.metaKey) && event.key === ',';
        if (isShortcut) {
            event.preventDefault();
            backdrop.classList.contains('is-open') ? closeSettings() : openSettings();
        }
        if (event.key === 'Escape' && confirmDialog.classList.contains('is-open')) {
            confirmDialog.classList.remove('is-open');
        } else if (event.key === 'Escape' && backdrop.classList.contains('is-open')) {
            closeSettings();
        }
        if (event.key === 'Tab' && backdrop.classList.contains('is-open')) {
            const focusable = [...backdrop.querySelectorAll('button:not(:disabled),select')];
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });

    const savedTheme = (() => { try { return localStorage.getItem('aetherstudio-theme'); } catch (_) { return null; } })();
    const preferences = readPreferences();
    setTheme(savedTheme === 'light');
    setReducedMotion(preferences.reducedMotion === true);

    // Apply preferences after the app has bound its existing controls.
    const appOnload = window.onload;
    window.onload = function (event) {
        if (typeof appOnload === 'function') appOnload.call(this, event);
        setVisualizer(preferences.visualizer || 'bars', false);
        setCrossfade(preferences.crossfade || 0, false);
        refreshStorageUsage();
    };

    // Load persistence only after the app's inline script has initialized its global state.
    const persistenceScript = document.createElement('script');
    persistenceScript.src = 'persistence.js';
    persistenceScript.defer = true;
    document.body.appendChild(persistenceScript);
})();
