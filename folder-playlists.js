/* Folder import and playlist label colors for Steal a Song. */
(() => {
    'use strict';

    const COLOR_KEY = 'steal-a-song-playlist-colors';
    const audioExtensions = /\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i;
    const folderInput = document.createElement('input');
    folderInput.type = 'file';
    folderInput.multiple = true;
    folderInput.accept = 'audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.webm';
    folderInput.setAttribute('webkitdirectory', '');
    folderInput.setAttribute('directory', '');
    folderInput.className = 'hidden';
    folderInput.id = 'folder-music-upload';
    document.body.appendChild(folderInput);

    function readColors() {
        try { return JSON.parse(localStorage.getItem(COLOR_KEY) || '{}'); }
        catch (_) { return {}; }
    }

    function saveColor(name, color) {
        const colors = readColors();
        colors[name] = color;
        try { localStorage.setItem(COLOR_KEY, JSON.stringify(colors)); } catch (_) { }
    }

    function makeColorDialog(title, initialName, initialColor, onSave) {
        const backdrop = document.createElement('div');
        backdrop.style.cssText = 'position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:#000b';
        const panel = document.createElement('form');
        panel.style.cssText = 'width:min(380px,100%);padding:22px;border:1px solid #52525b;border-radius:16px;background:#18181b;color:#f4f4f5;font:14px Inter,sans-serif;box-shadow:0 20px 60px #000';
        const heading = document.createElement('h2');
        heading.textContent = title;
        heading.style.cssText = 'margin:0 0 16px;font-size:18px;font-weight:600';
        const name = document.createElement('input');
        name.type = 'text'; name.required = true; name.maxLength = 80; name.value = initialName;
        name.placeholder = 'Playlist name';
        name.setAttribute('aria-label', 'Playlist name');
        name.style.cssText = 'box-sizing:border-box;width:100%;margin-bottom:14px;padding:10px;border:1px solid #52525b;border-radius:8px;background:#09090b;color:#fff';
        const colorRow = document.createElement('label');
        colorRow.textContent = 'Playlist text color';
        colorRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:18px';
        const color = document.createElement('input');
        color.type = 'color'; color.value = /^#[0-9a-f]{6}$/i.test(initialColor) ? initialColor : '#22d3ee';
        color.setAttribute('aria-label', 'Playlist text color');
        colorRow.appendChild(color);
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';
        const cancel = document.createElement('button');
        cancel.type = 'button'; cancel.textContent = 'Cancel';
        const save = document.createElement('button');
        save.type = 'submit'; save.textContent = 'Save';
        [cancel, save].forEach(button => {
            button.style.cssText = 'padding:9px 13px;border:1px solid #52525b;border-radius:8px;background:#27272a;color:#f4f4f5;cursor:pointer';
        });
        cancel.onclick = () => backdrop.remove();
        actions.append(cancel, save);
        panel.append(heading, name, colorRow, actions);
        panel.onsubmit = event => {
            event.preventDefault();
            const cleaned = name.value.trim();
            if (!cleaned) return;
            onSave(cleaned, color.value);
            backdrop.remove();
        };
        backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.remove(); });
        backdrop.appendChild(panel);
        document.body.appendChild(backdrop);
        name.focus(); name.select();
    }

    function applyPlaylistColors() {
        if (typeof state === 'undefined' || !document.getElementById('playlist-tabs')) return;
        const colors = readColors();
        const buttons = document.getElementById('playlist-tabs').children;
        state.playlists.forEach((playlist, index) => {
            if (playlist.id === 'all') return;
            const button = buttons[index];
            if (button && colors[playlist.name]) button.style.color = colors[playlist.name];
        });
    }

    function installHooks() {
        if (typeof renderPlaylists === 'function' && !window.__folderPlaylistRenderWrapped) {
            const originalRender = renderPlaylists;
            window.renderPlaylists = function (...args) {
                const result = originalRender.apply(this, args);
                applyPlaylistColors();
                return result;
            };
            window.__folderPlaylistRenderWrapped = true;
        }

        const header = document.querySelector('header > div:last-child');
        if (header && !document.getElementById('folder-upload-button')) {
            const button = document.createElement('button');
            button.id = 'folder-upload-button';
            button.type = 'button';
            button.textContent = 'Add Music Folder';
            button.className = 'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 border border-studio-700 text-xs sm:text-sm font-medium text-cyan-400 transition shadow-sm';
            button.addEventListener('click', () => folderInput.click());
            const exportButton = document.getElementById('btn-export-wav');
            header.insertBefore(button, exportButton);
        }

        const newPlaylistButton = document.getElementById('btn-new-playlist');
        if (newPlaylistButton && !newPlaylistButton.dataset.colorPlaylistHook) {
            newPlaylistButton.dataset.colorPlaylistHook = 'true';
            newPlaylistButton.onclick = () => makeColorDialog('Create playlist', `Playlist #${state.playlists.length}`, '#22d3ee', (name, color) => {
                const playlist = { id: 'pl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name, trackIds: [] };
                state.playlists.push(playlist);
                state.activePlaylistId = playlist.id;
                saveColor(name, color);
                renderPlaylists(); renderTrackList();
                if (typeof showToast === 'function') showToast(`Created playlist "${name}"`, 'success');
            });
        }
        applyPlaylistColors();
    }

    folderInput.addEventListener('change', () => {
        const audioFiles = Array.from(folderInput.files).filter(file => file.type.startsWith('audio/') || audioExtensions.test(file.name));
        folderInput.value = '';
        if (!audioFiles.length) {
            if (typeof showToast === 'function') showToast('No supported audio files found in that folder.', 'warn');
            return;
        }
        const groups = new Map();
        audioFiles.forEach(file => {
            const path = file.webkitRelativePath || file.name;
            const folderName = path.includes('/') ? path.split('/')[0] : 'Uploaded Music';
            if (!groups.has(folderName)) groups.set(folderName, []);
            groups.get(folderName).push(file);
        });
        const entries = Array.from(groups.entries());
        const addFolder = index => {
            if (index >= entries.length) return;
            const [folderName, files] = entries[index];
            makeColorDialog('Import folder as playlist', folderName, readColors()[folderName] || '#22d3ee', (name, color) => {
                const playlist = { id: 'pl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name, trackIds: [] };
                state.playlists.push(playlist);
                state.activePlaylistId = playlist.id;
                saveColor(name, color);
                handleFiles(files);
                renderPlaylists(); renderTrackList();
                addFolder(index + 1);
            });
        };
        addFolder(0);
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installHooks, { once: true });
    else installHooks();
    window.addEventListener('load', installHooks, { once: true });
})();
