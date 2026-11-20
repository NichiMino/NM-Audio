/* Folder import, playlist text colors, monochrome theme, and empty settings panel. */
(() => {
    'use strict';

    const COLOR_KEY = 'nm-audio-playlist-colors';
    const AUDIO_EXT = /\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i;

    // Persistence is loaded after the inline application has defined its state and onload handler.
    if (!document.querySelector('script[src="persistence.js"]')) {
        const persistence = document.createElement('script');
        persistence.src = 'persistence.js';
        document.head.appendChild(persistence);
    }

    const theme = document.createElement('style');
    theme.textContent = `
      body{background:#09090b!important;color:#e4e4e7!important}
      [class*="text-cyan-"],[class*="text-blue-"],[class*="text-purple-"],[class*="text-pink-"],[class*="text-rose-"],[class*="text-sky-"],[class*="text-emerald-"],[class*="text-amber-"],[class*="text-fuchsia-"]{color:#d4d4d8!important}
      [class*="bg-cyan-"],[class*="bg-blue-"],[class*="bg-purple-"],[class*="bg-pink-"],[class*="bg-rose-"],[class*="bg-sky-"],[class*="bg-emerald-"],[class*="bg-amber-"],[class*="bg-fuchsia-"]{background-color:#27272a!important}
      [class*="border-cyan-"],[class*="border-blue-"],[class*="border-purple-"],[class*="border-pink-"],[class*="border-rose-"],[class*="border-sky-"],[class*="border-emerald-"],[class*="border-amber-"],[class*="border-fuchsia-"]{border-color:#52525b!important}
      .bg-gradient-to-r,.bg-gradient-to-br{background-image:linear-gradient(135deg,#27272a,#52525b)!important}
      input[type=range]::-webkit-slider-thumb{background:#e4e4e7!important;box-shadow:0 0 8px #a1a1aa!important}
      input[type=range]::-moz-range-thumb{background:#e4e4e7!important;box-shadow:0 0 8px #a1a1aa!important}
      #visualizer-canvas{filter:grayscale(1)}
      ::selection{background:#52525b!important;color:#fff!important}
      .settings-tab-backdrop{position:fixed;inset:0;z-index:100;display:flex;justify-content:flex-end;background:#0009;backdrop-filter:blur(3px);opacity:0;visibility:hidden;transition:opacity 140ms ease,visibility 140ms ease}
      .settings-tab-backdrop.is-open{opacity:1;visibility:visible}
      .settings-tab-panel{width:min(420px,100%);height:100%;padding:24px;box-sizing:border-box;background:#111113;color:#f4f4f5;border-left:1px solid #3f3f46;box-shadow:-20px 0 60px #0008;font-family:Inter,sans-serif;transform:translateX(100%);transition:transform 160ms cubic-bezier(.2,.8,.2,1)}
      .settings-tab-backdrop.is-open .settings-tab-panel{transform:translateX(0)}
      @media(prefers-reduced-motion:reduce){.settings-tab-backdrop,.settings-tab-panel{transition:none}}
    `;
    document.head.appendChild(theme);

    function readColors() {
        try { return JSON.parse(localStorage.getItem(COLOR_KEY) || '{}'); } catch (_) { return {}; }
    }
    function saveColor(name, color) {
        const colors = readColors();
        colors[name] = color;
        try { localStorage.setItem(COLOR_KEY, JSON.stringify(colors)); } catch (_) { }
    }
    function applyColors() {
        if (typeof state === 'undefined') return;
        const colors = readColors();
        const buttons = document.getElementById('playlist-tabs')?.children;
        if (!buttons) return;
        state.playlists.forEach((playlist, index) => {
            const button = buttons[index];
            if (button && playlist.id !== 'all' && colors[playlist.name]) button.style.color = colors[playlist.name];
        });
    }

    function makeDialog(title, initialName, initialColor, callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:110;display:grid;place-items:center;padding:20px;background:#000b';
        const form = document.createElement('form');
        form.style.cssText = 'width:min(380px,100%);padding:22px;border:1px solid #52525b;border-radius:16px;background:#18181b;color:#f4f4f5;font:14px Inter,sans-serif';
        const heading = document.createElement('h2');
        heading.textContent = title;
        heading.style.cssText = 'margin:0 0 16px;font-size:18px;font-weight:600';
        const name = document.createElement('input');
        name.type = 'text'; name.required = true; name.maxLength = 80; name.value = initialName; name.placeholder = 'Playlist name';
        name.style.cssText = 'box-sizing:border-box;width:100%;margin-bottom:14px;padding:10px;border:1px solid #52525b;border-radius:8px;background:#09090b;color:#fff';
        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Playlist text color';
        colorLabel.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:18px';
        const color = document.createElement('input');
        color.type = 'color'; color.value = initialColor || '#d4d4d8'; colorLabel.appendChild(color);
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel';
        const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Save';
        [cancel, submit].forEach(button => { button.style.cssText = 'padding:9px 13px;border:1px solid #52525b;border-radius:8px;background:#27272a;color:#fff;cursor:pointer'; });
        cancel.onclick = () => overlay.remove();
        actions.append(cancel, submit);
        form.append(heading, name, colorLabel, actions);
        form.onsubmit = event => {
            event.preventDefault();
            if (name.value.trim()) { callback(name.value.trim(), color.value); overlay.remove(); }
        };
        overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
        overlay.appendChild(form); document.body.appendChild(overlay); name.focus(); name.select();
    }

    function makeSettingsPanel() {
        const headerActions = document.querySelector('header > div:last-child');
        if (!headerActions || document.getElementById('settings-tab-button')) return;

        const button = document.createElement('button');
        button.id = 'settings-tab-button';
        button.type = 'button';
        button.textContent = 'Settings';
        button.setAttribute('aria-haspopup', 'dialog');
        button.className = 'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 border border-studio-700 text-xs sm:text-sm font-medium text-zinc-200 transition';

        const backdrop = document.createElement('div');
        backdrop.className = 'settings-tab-backdrop';
        backdrop.innerHTML = '<section class="settings-tab-panel" role="dialog" aria-modal="true" aria-labelledby="settings-tab-title"><header style="display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid #27272a"><h2 id="settings-tab-title" style="margin:0;font-size:20px;font-weight:600">Settings</h2><button type="button" aria-label="Close settings" style="width:36px;height:36px;border:1px solid #52525b;border-radius:9px;background:#27272a;color:#f4f4f5;font-size:20px;cursor:pointer">×</button></header></section>';
        const close = backdrop.querySelector('button');
        let previouslyFocused = null;
        const open = () => {
            previouslyFocused = document.activeElement;
            backdrop.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            close.focus();
        };
        const dismiss = () => {
            backdrop.classList.remove('is-open');
            document.body.style.overflow = '';
            previouslyFocused?.focus?.();
        };
        button.addEventListener('click', open);
        close.addEventListener('click', dismiss);
        backdrop.addEventListener('click', event => { if (event.target === backdrop) dismiss(); });
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && backdrop.classList.contains('is-open')) dismiss(); });
        headerActions.appendChild(button);
        document.body.appendChild(backdrop);
    }

    const folderInput = document.createElement('input');
    folderInput.type = 'file'; folderInput.multiple = true;
    folderInput.accept = 'audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.webm';
    folderInput.setAttribute('webkitdirectory', ''); folderInput.setAttribute('directory', '');
    folderInput.id = 'folder-music-upload'; folderInput.hidden = true;
    document.body.appendChild(folderInput);

    function installHooks() {
        if (typeof state === 'undefined') return;
        const header = document.querySelector('header > div:last-child');
        if (header && !document.getElementById('folder-upload-button')) {
            const folderButton = document.createElement('button');
            folderButton.id = 'folder-upload-button'; folderButton.type = 'button'; folderButton.textContent = 'Add Music Folder';
            folderButton.className = 'inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-studio-800 border border-studio-700 text-xs font-medium text-zinc-200';
            folderButton.onclick = () => folderInput.click();
            header.insertBefore(folderButton, document.getElementById('btn-export-wav'));
        }
        makeSettingsPanel();

        const create = document.getElementById('btn-new-playlist');
        if (create && !create.dataset.colorPlaylistHook) {
            create.dataset.colorPlaylistHook = 'true';
            create.onclick = () => makeDialog('Create playlist', `Playlist #${state.playlists.length}`, '#d4d4d8', (name, color) => {
                const playlist = { id: 'pl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name, trackIds: [] };
                state.playlists.push(playlist); state.activePlaylistId = playlist.id; saveColor(name, color);
                renderPlaylists(); renderTrackList(); applyColors();
            });
        }
        applyColors();
    }

    folderInput.addEventListener('change', () => {
        const files = Array.from(folderInput.files).filter(file => file.type.startsWith('audio/') || AUDIO_EXT.test(file.name));
        folderInput.value = '';
        if (!files.length) { if (typeof showToast === 'function') showToast('No supported audio files found in that folder.', 'warn'); return; }
        const groups = new Map();
        for (const file of files) {
            const path = file.webkitRelativePath || file.name;
            const folder = path.includes('/') ? path.split('/')[0] : 'Uploaded Music';
            if (!groups.has(folder)) groups.set(folder, []);
            groups.get(folder).push(file);
        }
        const folders = [...groups.entries()];
        const importNext = index => {
            if (index >= folders.length) return;
            const [folder, folderFiles] = folders[index];
            makeDialog('Import folder as playlist', folder, readColors()[folder] || '#d4d4d8', (name, color) => {
                const playlist = { id: 'pl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name, trackIds: [] };
                state.playlists.push(playlist); state.activePlaylistId = playlist.id; saveColor(name, color);
                handleFiles(folderFiles);
                renderPlaylists(); renderTrackList(); applyColors();
                importNext(index + 1);
            });
        };
        importNext(0);
    });

    const tabs = document.getElementById('playlist-tabs');
    if (tabs) new MutationObserver(applyColors).observe(tabs, { childList: true });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installHooks, { once: true });
    else installHooks();
    window.addEventListener('load', installHooks, { once: true });
})();
