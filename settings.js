/* AetherStudio settings panel, local preferences, and monochrome studio theme. */
(() => {
    'use strict';

    const STORAGE_KEY = 'aetherstudio-preferences';
    const DB_NAME = 'aetherstudio-library';

    // Keep the application dark and remove any legacy theme preference.
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    try { localStorage.removeItem('aetherstudio-theme'); } catch (_) { }

    const styles = `
        /* Monochrome palette overrides for the app's Tailwind utility classes. */
        body{background:#090909!important;color:#f5f5f5!important;selection-background-color:#fff;selection-color:#000}
        [class*="text-cyan-"],[class*="text-blue-"],[class*="text-purple-"],[class*="text-pink-"],[class*="text-fuchsia-"],[class*="text-sky-"],[class*="text-emerald-"],[class*="text-teal-"],[class*="text-rose-"],[class*="text-amber-"],[class*="text-green-"]{color:#e4e4e7!important}
        [class*="bg-cyan-"],[class*="bg-blue-"],[class*="bg-purple-"],[class*="bg-pink-"],[class*="bg-fuchsia-"],[class*="bg-sky-"],[class*="bg-emerald-"],[class*="bg-teal-"],[class*="bg-rose-"],[class*="bg-amber-"],[class*="bg-green-"]{background-color:#27272a!important}
        [class*="border-cyan-"],[class*="border-blue-"],[class*="border-purple-"],[class*="border-pink-"],[class*="border-fuchsia-"],[class*="border-sky-"],[class*="border-emerald-"],[class*="border-teal-"],[class*="border-rose-"],[class*="border-amber-"],[class*="border-green-"]{border-color:#52525b!important}
        [class*="from-cyan-"],[class*="from-blue-"],[class*="from-purple-"],[class*="from-pink-"],[class*="from-fuchsia-"],[class*="to-cyan-"],[class*="to-blue-"],[class*="to-purple-"],[class*="to-pink-"],[class*="to-fuchsia-"],[class*="via-purple-"]{--tw-gradient-from:#27272a var(--tw-gradient-from-position)!important;--tw-gradient-to:rgb(39 39 42 / 0%) var(--tw-gradient-to-position)!important;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)!important}
        [class*="shadow-cyan-"],[class*="shadow-blue-"],[class*="shadow-purple-"],[class*="shadow-pink-"]{--tw-shadow-color:#000!important;box-shadow:0 10px 24px rgb(0 0 0 / 35%)!important}
        input[type="range"]::-webkit-slider-thumb{background:#f4f4f5!important;box-shadow:0 0 0 2px #090909,0 0 0 3px #a1a1aa!important}
        input[type="range"]::-moz-range-thumb{background:#f4f4f5!important;box-shadow:0 0 0 2px #090909,0 0 0 3px #a1a1aa!important}
        .drag-over-active{border-color:#fff!important;background-color:#ffffff12!important}
        #visualizer-canvas{filter:grayscale(1)}
        .aether-settings-launcher{position:fixed;left:20px;bottom:20px;z-index:40;display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid #52525b;border-radius:14px;background:#18181b;color:#f4f4f5;box-shadow:0 12px 30px #0008;font:600 13px Inter,sans-serif;cursor:pointer;transition:transform .18s,background .18s}
        .aether-settings-launcher:hover{background:#27272a;transform:translateY(-2px)}
        .aether-settings-launcher:focus-visible,.aether-settings-close:focus-visible,.aether-settings-control:focus-visible,.aether-settings-action:focus-visible{outline:2px solid #f4f4f5;outline-offset:3px}
        .aether-settings-backdrop{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:20px;background:rgb(0 0 0 / 72%);backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:opacity .2s,visibility .2s}
        .aether-settings-backdrop.is-open{opacity:1;visibility:visible}
        .aether-settings-window{width:min(600px,100%);max-height:min(88vh,800px);overflow:auto;border:1px solid #3f3f46;border-radius:18px;background:#111113;color:#f4f4f5;box-shadow:0 24px 80px #000b;transform:translateY(10px) scale(.99);opacity:0;transition:transform .2s,opacity .2s;font-family:Inter,sans-serif}
        .aether-settings-backdrop.is-open .aether-settings-window{transform:translateY(0) scale(1);opacity:1}
        .aether-settings-titlebar{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:15px 20px;background:#090909;border-bottom:1px solid #27272a}
        .aether-settings-dots{display:flex;gap:7px}.aether-settings-dots i{width:9px;height:9px;border-radius:50%;background:#a1a1aa}.aether-settings-dots i:nth-child(2){background:#71717a}.aether-settings-dots i:nth-child(3){background:#52525b}
        .aether-settings-close{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:9px;background:#27272a;color:#e4e4e7;font-size:20px;cursor:pointer}
        .aether-settings-content{padding:22px}.aether-settings-content h2{margin:0 0 6px;font:600 20px Inter,sans-serif}.aether-settings-intro{margin:0 0 18px;color:#a1a1aa;font:14px/1.5 Inter,sans-serif}
        .aether-settings-section{margin-top:20px}.aether-settings-section h3{margin:0 0 9px;color:#d4d4d8;font:600 11px Inter,sans-serif;text-transform:uppercase;letter-spacing:.1em}
        .aether-settings-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:8px;padding:13px;border:1px solid #2a2a2e;border-radius:12px;background:#19191c;font:13px Inter,sans-serif}
        .aether-settings-row strong{display:block;color:#f4f4f5;font-weight:600}.aether-settings-row small{display:block;margin-top:4px;color:#a1a1aa;line-height:1.4}
        .aether-settings-control{max-width:180px;padding:8px 10px;border:1px solid #52525b;border-radius:9px;background:#101014;color:#f4f4f5;font:12px Inter,sans-serif}
        .aether-settings-action{padding:8px 11px;border:1px solid #52525b;border-radius:9px;background:#27272a;color:#e4e4e7;font:600 12px Inter,sans-serif;cursor:pointer}.aether-settings-action:hover{background:#3f3f46}.aether-settings-action.danger{border-color:#71717a;background:#27272a;color:#fafafa}
        .aether-settings-hint{margin:10px 2px 0;color:#71717a;font:11px/1.5 Inter,sans-serif}
        .aether-settings-confirm{position:fixed;inset:0;z-index:70;display:none;place-items:center;padding:20px;background:#000a}.aether-settings-confirm.is-open{display:grid}.aether-settings-confirm-box{width:min(390px,100%);padding:22px;border:1px solid #52525b;border-radius:16px;background:#18181b;color:#f4f4f5;box-shadow:0 20px 60px #000b;font:14px/1.5 Inter,sans-serif}.aether-settings-confirm-box p{color:#a1a1aa}.aether-settings-confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
        @media(max-width:520px){.aether-settings-row{align-items:flex-start;flex-direction:column}.aether-settings-control{max-width:none;width:100%}.aether-settings-launcher{left:12px;bottom:12px}}
        @media(prefers-reduced-motion:reduce){.aether-settings-launcher,.aether-settings-backdrop,.aether-settings-window{transition:none!important}}
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
                <div class="aether-settings-section"><h3>Accessibility</h3>
                    <div class="aether-settings-row"><div><strong>Reduce motion</strong><small>Limit decorative animation and transitions.</small></div><button type="button" id="aether-motion-toggle" class="aether-settings-action" aria-pressed="false">Enable</button></div>
                </div>
                <div class="aether-settings-section"><h3>Playback</h3>
                    <div class="aether-settings-row"><div><strong>Visualizer</strong><small>Choose the display used by the audio deck.</small></div><select id="aether-visualizer" class="aether-settings-control"><option value="bars">Spectrum</option><option value="wave">Waveform</option><option value="mirror">Dual mirror</option></select></div>
                    <div class="aether-settings-row"><div><strong>Track crossfade</strong><small>Default transition duration between tracks.</small></div><select id="aether-crossfade" class="aether-settings-control"><option value="0">Off</option><option value="1">1 second</option><option value="2">2 seconds</option><option value="3">3 seconds</option><option value="4">4 seconds</option><option value="5">5 seconds</option><option value="6">6 seconds</option><option value="7">7 seconds</option><option value="8">8 seconds</option></select></div>
                    <div class="aether-settings-row"><div><strong>Default volume</strong><small>Volume used when opening the studio.</small></div><select id="aether-default-volume" class="aether-settings-control"><option value="25">25%</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option><option value="125">125%</option><option value="150">150%</option></select></div>
                    <div class="aether-settings-row"><div><strong>Keyboard shortcuts</strong><small>Space: play/pause · ←/→: seek · M: mute</small></div><button type="button" id="aether-shortcuts-toggle" class="aether-settings-action" aria-pressed="true">Enabled</button></div>
                </div>
                <div class="aether-settings-section"><h3>Local music library</h3>
                    <div class="aether-settings-row"><div><strong>Browser storage</strong><small id="aether-storage-usage">Checking local storage…</small></div><button type="button" id="aether-refresh-storage" class="aether-settings-action">Refresh</button></div>
                    <div class="aether-settings-row"><div><strong>Clear saved library</strong><small>Remove uploaded tracks and playlists saved in this browser.</small></div><button type="button" id="aether-clear-library" class="aether-settings-action danger">Clear library</button></div>
                    <div class="aether-settings-row"><div><strong>Reset preferences</strong><small>Restore settings to their defaults. Your music library will stay.</small></div><button type="button" id="aether-reset-preferences" class="aether-settings-action">Reset</button></div>
                    <p class="aether-settings-hint">Your music is stored locally in this browser and is not uploaded to a server. Clearing browser site data also removes this library.</p>
                </div>
            </div>
        </section>`;

    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'aether-settings-confirm';
    confirmDialog.innerHTML = '<section class="aether-settings-confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="aether-clear-heading"><strong id="aether-clear-heading">Clear saved music?</strong><p>This permanently removes the locally saved tracks and playlists from this browser.</p><div class="aether-settings-confirm-actions"><button type="button" class="aether-settings-action" data-clear-cancel>Cancel</button><button type="button" class="aether-settings-action danger" data-clear-confirm>Clear library</button></div></section>';
    document.body.append(launcher, backdrop, confirmDialog);

    const closeButton = backdrop.querySelector('.aether-settings-close');
    const motionButton = backdrop.querySelector('#aether-motion-toggle');
    const shortcutsButton = backdrop.querySelector('#aether-shortcuts-toggle');
    const visualizerSelect = backdrop.querySelector('#aether-visualizer');
    const crossfadeSelect = backdrop.querySelector('#aether-crossfade');
    const volumeSelect = backdrop.querySelector('#aether-default-volume');
    const storageUsage = backdrop.querySelector('#aether-storage-usage');
    let previousFocus = null;

    function readPreferences() {
        try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; }
        catch (_) { return {}; }
    }
    function savePreference(key, value) {
        const preferences = readPreferences();
        preferences[key] = value;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch (_) { }
    }
    function setReducedMotion(enabled) {
        document.documentElement.classList.toggle('aether-reduced-motion', enabled);
        motionButton.textContent = enabled ? 'Disable' : 'Enable';
        motionButton.setAttribute('aria-pressed', String(enabled));
        savePreference('reducedMotion', enabled);
    }
    function setShortcuts(enabled, persist = true) {
        shortcutsButton.textContent = enabled ? 'Enabled' : 'Disabled';
        shortcutsButton.setAttribute('aria-pressed', String(enabled));
        if (persist) savePreference('keyboardShortcuts', enabled);
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
        if (slider) { slider.value = value; slider.dispatchEvent(new Event('input', { bubbles: true })); }
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
        } catch (_) { storageUsage.textContent = 'Could not read browser storage usage.'; }
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
    motionButton.addEventListener('click', () => setReducedMotion(!document.documentElement.classList.contains('aether-reduced-motion')));
    shortcutsButton.addEventListener('click', () => setShortcuts(shortcutsButton.getAttribute('aria-pressed') !== 'true'));
    visualizerSelect.addEventListener('change', () => setVisualizer(visualizerSelect.value));
    crossfadeSelect.addEventListener('change', () => setCrossfade(crossfadeSelect.value));
    volumeSelect.addEventListener('change', () => savePreference('defaultVolume', volumeSelect.value));
    backdrop.querySelector('#aether-refresh-storage').addEventListener('click', refreshStorageUsage);
    backdrop.querySelector('#aether-reset-preferences').addEventListener('click', () => {
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) { }
        setReducedMotion(false);
        setShortcuts(true, false);
        setVisualizer('bars', false);
        setCrossfade(0, false);
        volumeSelect.value = '100';
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) { }
        storageUsage.textContent = 'Preferences restored. Your library is unchanged.';
    });

    backdrop.querySelector('#aether-clear-library').addEventListener('click', () => {
        confirmDialog.classList.add('is-open');
        confirmDialog.querySelector('[data-clear-cancel]').focus();
    });
    confirmDialog.querySelector('[data-clear-cancel]').addEventListener('click', () => {
        confirmDialog.classList.remove('is-open');
        backdrop.querySelector('#aether-clear-library').focus();
    });
    confirmDialog.addEventListener('click', event => { if (event.target === confirmDialog) confirmDialog.classList.remove('is-open'); });
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
        if ((event.ctrlKey || event.metaKey) && event.key === ',') {
            event.preventDefault();
            backdrop.classList.contains('is-open') ? closeSettings() : openSettings();
        }
        if (event.key === 'Escape' && confirmDialog.classList.contains('is-open')) confirmDialog.classList.remove('is-open');
        else if (event.key === 'Escape' && backdrop.classList.contains('is-open')) closeSettings();

        if (readPreferences().keyboardShortcuts === false || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = event.target;
        if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))) return;
        if (event.code === 'Space') {
            event.preventDefault();
            document.getElementById('btn-play-pause')?.click();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const audio = document.querySelector('audio');
            if (audio && Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + (event.key === 'ArrowLeft' ? -5 : 5)));
        } else if (event.key.toLowerCase() === 'm') {
            document.getElementById('btn-mute')?.click();
        }
    });

    const preferences = readPreferences();
    document.documentElement.classList.toggle('aether-reduced-motion', preferences.reducedMotion === true);
    motionButton.textContent = preferences.reducedMotion === true ? 'Disable' : 'Enable';
    motionButton.setAttribute('aria-pressed', String(preferences.reducedMotion === true));
    setShortcuts(preferences.keyboardShortcuts !== false, false);
    volumeSelect.value = ['25', '50', '75', '100', '125', '150'].includes(String(preferences.defaultVolume)) ? String(preferences.defaultVolume) : '100';

    const appOnload = window.onload;
    window.onload = function (event) {
        if (typeof appOnload === 'function') appOnload.call(this, event);
        setVisualizer(preferences.visualizer || 'bars', false);
        setCrossfade(preferences.crossfade || 0, false);
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider && preferences.defaultVolume != null) {
            volumeSlider.value = volumeSelect.value / 100;
            volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
        }
        refreshStorageUsage();
    };

    const persistenceScript = document.createElement('script');
    persistenceScript.src = 'persistence.js';
    persistenceScript.defer = true;
    document.body.appendChild(persistenceScript);
})();
