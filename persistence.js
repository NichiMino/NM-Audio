/* Persist AetherStudio's local library and resume position in this browser. */
(() => {
    'use strict';

    const DB_NAME = 'aetherstudio-library';
    const DB_VERSION = 1;
    const TRACK_STORE = 'tracks';
    const STATE_STORE = 'state';
    const STATE_KEY = 'studio';

    let databasePromise;
    let lastSavedTrackIds = new Set();
    let saveQueue = Promise.resolve();
    let ready = false;
    let initialized = false;

    function openDatabase() {
        if (databasePromise) return databasePromise;
        databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(TRACK_STORE)) db.createObjectStore(TRACK_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(STATE_STORE)) db.createObjectStore(STATE_STORE, { keyPath: 'key' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Could not open local music storage.'));
        });
        return databasePromise;
    }

    function requestResult(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Local music storage request failed.'));
        });
    }

    async function readSavedState(db) {
        const tx = db.transaction([TRACK_STORE, STATE_STORE], 'readonly');
        const trackRequest = tx.objectStore(TRACK_STORE).getAll();
        const stateRequest = tx.objectStore(STATE_STORE).get(STATE_KEY);
        const [savedTracks, savedState] = await Promise.all([requestResult(trackRequest), requestResult(stateRequest)]);
        return { savedTracks, savedState: savedState || null };
    }

    function restoreDSPDefaults() {
        state.activePreset = 'normal';
        state.dsp.speed = 1;
        state.dsp.resamplePitch = true;
        state.dsp.eq = [0, 0, 0, 0, 0];
        state.dsp.reverb = 0;
        state.dsp.pan = 0;
        state.dsp.autoPan = false;
        state.dsp.lowpass = 20000;
        // Keep user volume and crossfade settings; reset the creative effects.
    }

    async function restoreLibrary() {
        const db = await openDatabase();
        const { savedTracks, savedState } = await readSavedState(db);
        const savedById = new Map(savedTracks.map(track => [track.id, track]));
        lastSavedTrackIds = new Set(savedById.keys());

        const restoredTracks = [];
        for (const saved of savedTracks) {
            if (!(saved.file instanceof Blob)) continue;
            const filename = saved.fileName || `${saved.name || 'Audio'}.${(saved.format || 'audio').toLowerCase()}`;
            const file = saved.file instanceof File
                ? saved.file
                : new File([saved.file], filename, { type: saved.file.type || 'audio/*' });
            restoredTracks.push({
                id: saved.id,
                name: saved.name || filename.replace(/\.[^.]+$/, ''),
                format: saved.format || 'AUDIO',
                duration: Number(saved.duration) || 0,
                file,
                url: URL.createObjectURL(file)
            });
        }

        state.tracks = restoredTracks;
        const validIds = new Set(restoredTracks.map(track => track.id));
        const savedPlaylists = savedState && Array.isArray(savedState.playlists) ? savedState.playlists : null;
        if (savedPlaylists && savedPlaylists.length) {
            const allTracks = savedPlaylists.find(playlist => playlist.id === 'all') || { id: 'all', name: 'All Tracks', trackIds: [] };
            state.playlists = [
                { id: 'all', name: 'All Tracks', trackIds: allTracks.trackIds.filter(id => validIds.has(id)) },
                ...savedPlaylists
                    .filter(playlist => playlist.id !== 'all' && typeof playlist.name === 'string')
                    .map(playlist => ({
                        id: playlist.id,
                        name: playlist.name,
                        trackIds: Array.isArray(playlist.trackIds) ? playlist.trackIds.filter(id => validIds.has(id)) : []
                    }))
            ];
        } else {
            state.playlists = [{ id: 'all', name: 'All Tracks', trackIds: restoredTracks.map(track => track.id) }];
        }

        const activeId = savedState && savedState.activePlaylistId;
        state.activePlaylistId = state.playlists.some(playlist => playlist.id === activeId) ? activeId : 'all';
        const trackId = savedState && validIds.has(savedState.currentTrackId) ? savedState.currentTrackId : null;
        state.currentTrackId = null;
        state.isPlaying = false;
        restoreDSPDefaults();

        if (typeof renderPlaylists === 'function') renderPlaylists();
        if (typeof renderTrackList === 'function') renderTrackList();
        if (typeof syncControlsFromState === 'function') syncControlsFromState();
        if (typeof renderPresetButtons === 'function') renderPresetButtons();
        if (trackId && typeof loadTrack === 'function') {
            const resumeAt = Number(savedState.position) || 0;
            loadTrack(trackId, false);
            audioEl.addEventListener('loadedmetadata', () => {
                if (state.currentTrackId !== trackId) return;
                const upperBound = Number.isFinite(audioEl.duration) ? Math.max(0, audioEl.duration - 0.1) : resumeAt;
                try { audioEl.currentTime = Math.min(resumeAt, upperBound); } catch (_) { }
                state.isPlaying = false;
                if (typeof updateTransportUI === 'function') updateTransportUI();
            }, { once: true });
        }

        ready = true;
    }

    function currentSnapshot() {
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

    async function persistSnapshot() {
        if (!ready || !databasePromise) return;
        const db = await openDatabase();
        const presentIds = new Set(state.tracks.map(track => track.id));
        const tx = db.transaction([TRACK_STORE, STATE_STORE], 'readwrite');
        const trackStore = tx.objectStore(TRACK_STORE);

        for (const track of state.tracks) {
            if (!track.file || lastSavedTrackIds.has(track.id)) continue;
            trackStore.put({
                id: track.id,
                name: track.name,
                format: track.format,
                duration: track.duration,
                fileName: track.file.name,
                file: track.file
            });
            lastSavedTrackIds.add(track.id);
        }
        for (const id of lastSavedTrackIds) {
            if (!presentIds.has(id)) {
                trackStore.delete(id);
                lastSavedTrackIds.delete(id);
            }
        }
        tx.objectStore(STATE_STORE).put(currentSnapshot());
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error || new Error('Could not save your library.'));
            tx.onabort = () => reject(tx.error || new Error('Could not save your library.'));
        });
    }

    function scheduleSave() {
        if (!ready) return;
        saveQueue = saveQueue
            .then(() => persistSnapshot())
            .catch(error => {
                console.warn('AetherStudio could not save the local library:', error);
                if (typeof showToast === 'function') showToast('Could not save your music. Check available browser storage.', 'warn');
            });
    }

    function installPersistence() {
        if (initialized) return;
        initialized = true;
        const appOnload = window.onload;
        window.onload = async function (event) {
            try {
                await restoreLibrary();
            } catch (error) {
                console.warn('AetherStudio could not restore the local library:', error);
                ready = true;
            }
            if (typeof appOnload === 'function') appOnload.call(this, event);
            // A preset is deliberately not restored: each visit starts with clean, neutral FX.
            if (typeof applyPreset === 'function') applyPreset('normal');
            scheduleSave();
        };

        audioEl.addEventListener('timeupdate', scheduleSave);
        audioEl.addEventListener('pause', scheduleSave);
        audioEl.addEventListener('play', scheduleSave);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') scheduleSave();
        });
        window.addEventListener('pagehide', scheduleSave);
        window.setInterval(scheduleSave, 1000);
    }

    try {
        if (!('indexedDB' in window) || !('File' in window)) {
            console.warn('This browser does not support persistent local music storage.');
            return;
        }
        installPersistence();
    } catch (error) {
        console.warn('AetherStudio persistence is unavailable:', error);
    }
})();
