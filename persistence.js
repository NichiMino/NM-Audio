/* Persist the local music library, playlists, active playlist and resume position. */
(() => {
    'use strict';

    const DB_NAME = 'steal-a-song-library';
    const DB_VERSION = 1;
    const TRACK_STORE = 'tracks';
    const STATE_STORE = 'state';
    const STATE_KEY = 'studio';
    const QUICK_STATE_KEY = 'steal-a-song-quick-state';
    let dbPromise;
    let ready = false;
    let saveTimer = 0;
    let lastQuickSave = 0;
    let savedTrackIds = new Set();
    let saving = Promise.resolve();

    function openDatabase() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(TRACK_STORE)) db.createObjectStore(TRACK_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(STATE_STORE)) db.createObjectStore(STATE_STORE, { keyPath: 'key' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Unable to open local music storage.'));
        });
        return dbPromise;
    }

    function requestValue(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Unable to read local music storage.'));
        });
    }

    function snapshot() {
        return {
            key: STATE_KEY,
            playlists: state.playlists.map(playlist => ({
                id: playlist.id,
                name: playlist.name,
                trackIds: [...playlist.trackIds]
            })),
            activePlaylistId: state.activePlaylistId,
            currentTrackId: state.currentTrackId,
            position: state.currentTrackId && Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0,
            savedAt: Date.now()
        };
    }

    function saveQuickState() {
        if (!ready) return;
        try { localStorage.setItem(QUICK_STATE_KEY, JSON.stringify(snapshot())); } catch (_) { }
    }

    async function persist() {
        if (!ready) return;
        const db = await openDatabase();
        const tx = db.transaction([TRACK_STORE, STATE_STORE], 'readwrite');
        const tracks = tx.objectStore(TRACK_STORE);
        const currentIds = new Set(state.tracks.map(track => track.id));
        const addedIds = [];
        for (const track of state.tracks) {
            if (track.file && !savedTrackIds.has(track.id)) {
                tracks.put({ id: track.id, name: track.name, format: track.format, duration: track.duration, fileName: track.file.name, file: track.file });
                addedIds.push(track.id);
            }
        }
        for (const id of savedTrackIds) if (!currentIds.has(id)) tracks.delete(id);
        tx.objectStore(STATE_STORE).put(snapshot());
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = tx.onabort = () => reject(tx.error || new Error('Unable to save the local library.'));
        });
        addedIds.forEach(id => savedTrackIds.add(id));
        for (const id of savedTrackIds) if (!currentIds.has(id)) savedTrackIds.delete(id);
    }

    function scheduleSave(immediate = false) {
        if (!ready) return;
        saveQuickState();
        clearTimeout(saveTimer);
        const run = () => {
            saving = saving.then(persist).catch(error => console.warn('Could not save Steal a Song library:', error));
        };
        if (immediate) run();
        else saveTimer = setTimeout(run, 350);
    }

    async function restore() {
        const db = await openDatabase();
        const tx = db.transaction([TRACK_STORE, STATE_STORE], 'readonly');
        const [savedTracks, dbState] = await Promise.all([
            requestValue(tx.objectStore(TRACK_STORE).getAll()),
            requestValue(tx.objectStore(STATE_STORE).get(STATE_KEY))
        ]);
        savedTrackIds = new Set(savedTracks.map(track => track.id));
        const validTracks = [];
        for (const saved of savedTracks) {
            if (!saved.file || !(saved.file instanceof Blob)) continue;
            const filename = saved.fileName || `${saved.name || 'Audio'}.${(saved.format || 'audio').toLowerCase()}`;
            const file = saved.file instanceof File ? saved.file : new File([saved.file], filename, { type: saved.file.type || 'audio/*' });
            validTracks.push({
                id: saved.id,
                name: saved.name || filename.replace(/\.[^.]+$/, ''),
                format: saved.format || 'AUDIO',
                duration: Number(saved.duration) || 0,
                file,
                url: URL.createObjectURL(file)
            });
        }
        state.tracks = validTracks;
        const validIds = new Set(validTracks.map(track => track.id));
        let quickState = null;
        try { quickState = JSON.parse(localStorage.getItem(QUICK_STATE_KEY) || 'null'); } catch (_) { }
        const savedState = quickState && quickState.savedAt >= (dbState?.savedAt || 0) ? quickState : dbState;
        const storedPlaylists = Array.isArray(savedState?.playlists) ? savedState.playlists : null;
        if (storedPlaylists?.length) {
            const all = storedPlaylists.find(playlist => playlist.id === 'all');
            state.playlists = [{
                id: 'all', name: 'All Tracks',
                trackIds: Array.isArray(all?.trackIds) ? all.trackIds.filter(id => validIds.has(id)) : validTracks.map(track => track.id)
            }, ...storedPlaylists.filter(playlist => playlist.id !== 'all' && typeof playlist.name === 'string').map(playlist => ({
                id: playlist.id,
                name: playlist.name,
                trackIds: Array.isArray(playlist.trackIds) ? playlist.trackIds.filter(id => validIds.has(id)) : []
            }))];
        } else {
            state.playlists = [{ id: 'all', name: 'All Tracks', trackIds: validTracks.map(track => track.id) }];
        }
        state.activePlaylistId = state.playlists.some(playlist => playlist.id === savedState?.activePlaylistId) ? savedState.activePlaylistId : 'all';

        // Always start with normal DSP; restore the selected song and position, but never autoplay.
        state.activePreset = 'normal';
        Object.assign(state.dsp, { speed: 1, resamplePitch: true, eq: [0, 0, 0, 0, 0], reverb: 0, pan: 0, autoPan: false, lowpass: 20000 });
        state.currentTrackId = null;
        state.isPlaying = false;
        const trackId = validIds.has(savedState?.currentTrackId) ? savedState.currentTrackId : null;
        if (trackId) {
            const resumeAt = Math.max(0, Number(savedState.position) || 0);
            const onMetadata = () => {
                if (state.currentTrackId !== trackId) return;
                const maxPosition = Number.isFinite(audioEl.duration) ? Math.max(0, audioEl.duration - 0.1) : resumeAt;
                try { audioEl.currentTime = Math.min(resumeAt, maxPosition); } catch (_) { }
                state.isPlaying = false;
                if (typeof updateTransportUI === 'function') updateTransportUI();
                if (typeof renderTrackList === 'function') renderTrackList();
                scheduleSave(true);
            };
            audioEl.addEventListener('loadedmetadata', onMetadata, { once: true });
            loadTrack(trackId, false);
            if (audioEl.readyState >= 1) onMetadata();
        }
        ready = true;
        if (typeof renderPlaylists === 'function') renderPlaylists();
        if (typeof renderTrackList === 'function') renderTrackList();
        if (typeof syncControlsFromState === 'function') syncControlsFromState();
        if (typeof renderPresetButtons === 'function') renderPresetButtons();
    }

    function initialize() {
        if (!('indexedDB' in window) || !('File' in window) || typeof state === 'undefined') return;
        const appOnload = window.onload;
        window.onload = async function (event) {
            try {
                await restore();
            } catch (error) {
                console.warn('Could not restore Steal a Song library:', error);
                ready = true;
            }
            if (typeof appOnload === 'function') appOnload.call(this, event);
            if (typeof applyPreset === 'function') applyPreset('normal');
            scheduleSave(true);
        };
        audioEl.addEventListener('timeupdate', () => {
            if (Date.now() - lastQuickSave > 700) {
                lastQuickSave = Date.now();
                scheduleSave();
            }
        });
        ['pause', 'play', 'loadedmetadata'].forEach(type => audioEl.addEventListener(type, () => scheduleSave(true)));
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') scheduleSave(true);
        });
        window.addEventListener('pagehide', () => scheduleSave(true));
        window.setInterval(() => scheduleSave(), 1500);
    }

    initialize();
})();
