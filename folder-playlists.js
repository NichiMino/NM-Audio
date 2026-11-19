/* Folder import, playlist text colors, startup persistence loader, and grayscale theme. */
(() => {
    'use strict';
    const COLOR_KEY = 'steal-a-song-playlist-colors';
    const AUDIO_EXT = /\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i;

    // Load persistence after the page's inline application code has defined its state and onload handler.
    const persistenceScript = document.createElement('script');
    persistenceScript.src = 'persistence.js';
    document.head.appendChild(persistenceScript);

    // Replace the blue/purple accents with a neutral black, charcoal, gray, and white palette.
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
    `;
    document.head.appendChild(theme);

    function readColors() {
        try { return JSON.parse(localStorage.getItem(COLOR_KEY) || '{}'); } catch (_) { return {}; }
    }
    function saveColor(name, color) {
        const colors = readColors(); colors[name] = color;
        try { localStorage.setItem(COLOR_KEY, JSON.stringify(colors)); } catch (_) { }
    }
    function applyColors() {
        if (typeof state === 'undefined') return;
        const colors = readColors();
        const buttons = document.getElementById('playlist-tabs')?.children;
        if (!buttons) return;
        let buttonIndex = 0;
        for (const playlist of state.playlists) {
            const button = buttons[buttonIndex++];
            if (button && playlist.id !== 'all' && colors[playlist.name]) button.style.color = colors[playlist.name];
        }
    }

    const folderInput = document.createElement('input');
    folderInput.type = 'file'; folderInput.multiple = true;
    folderInput.accept = 'audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.webm';
    folderInput.setAttribute('webkitdirectory', ''); folderInput.setAttribute('directory', '');
    folderInput.id = 'folder-music-upload'; folderInput.hidden = true;
    document.body.appendChild(folderInput);

    function colorDialog(title, defaultName, defaultColor, callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:#000b';
        const form = document.createElement('form');
        form.style.cssText = 'width:min(380px,100%);padding:22px;border:1px solid #52525b;border-radius:16px;background:#18181b;color:#f4f4f5;font:14px Inter,sans-serif';
        const heading = document.createElement('h2'); heading.textContent = title;
        const name = document.createElement('input');
        name.required = true; name.maxLength = 80; name.value = defaultName; name.placeholder = 'Playlist name';
        name.style.cssText = 'box-sizing:border-box;width:100%;margin:16px 0;padding:10px;border:1px solid #52525b;border-radius:8px;background:#09090b;color:white';
        const colorLabel = document.createElement('label'); colorLabel.textContent = 'Playlist text color';
        colorLabel.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:18px';
        const color = document.createElement('input'); color.type = 'color'; color.value = defaultColor || '#d4d4d8'; colorLabel.appendChild(color);
        const buttons = document.createElement('div'); buttons.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel';
        const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Save';
        [cancel, submit].forEach(button => { button.style.cssText = 'padding:9px 13px;border:1px solid #52525b;border-radius:8px;background:#27272a;color:white'; });
        cancel.onclick = () => overlay.remove();
        buttons.append(cancel, submit);
        form.append(heading, name, colorLabel, buttons);
        form.onsubmit = event => {
            event.preventDefault();
            if (!name.value.trim()) return;
            callback(name.value.trim(), color.value);
            overlay.remove();
        };
        overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
        overlay.appendChild(form); document.body.appendChild(overlay); name.focus(); name.select();
    }

    function installHooks() {
        if (typeof state === 'undefined') return;
        const header = document.querySelector('header > div:last-child');
        if (header && !document.getElementById('folder-upload-button')) {
            const button = document.createElement('button');
            button.id = 'folder-upload-button'; button.type = 'button'; button.textContent = 'Add Music Folder';
            button.className = 'inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-studio-800 border border-studio-700 text-xs font-medium text-zinc-200';
            button.onclick = () => folderInput.click();
            header.insertBefore(button, document.getElementById('btn-export-wav'));
        }
        const create = document.getElementById('btn-new-playlist');
        if (create && !create.dataset.colorPlaylistHook) {
            create.dataset.colorPlaylistHook = 'true';
            create.onclick = () => colorDialog('Create playlist', `Playlist #${state.playlists.length}`, '#d4d4d8', (name, color) => {
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
        if (!files.length) { showToast('No supported audio files found in that folder.', 'warn'); return; }
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
            colorDialog('Import folder as playlist', folder, readColors()[folder] || '#d4d4d8', (name, color) => {
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
