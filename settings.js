/* Steal a Song settings panel and local preferences. */
(() => {
    'use strict';

    const STORAGE_KEY = 'steal-a-song-preferences';
    const DB_NAME = 'steal-a-song-library';

    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';

    const style = document.createElement('style');
    style.textContent = `
        body{background:#090909!important;color:#f5f5f5!important}
        [class*="text-cyan-"],[class*="text-blue-"],[class*="text-purple-"],[class*="text-pink-"]{color:#e4e4e7!important}
        [class*="bg-cyan-"],[class*="bg-blue-"],[class*="bg-purple-"],[class*="bg-pink-"]{background-color:#27272a!important}
        [class*="border-cyan-"],[class*="border-blue-"],[class*="border-purple-"],[class*="border-pink-"]{border-color:#52525b!important}
        .steal-settings-launcher{position:fixed;left:20px;bottom:20px;z-index:40;display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid #52525b;border-radius:14px;background:#18181b;color:#f4f4f5;box-shadow:0 12px 30px #0008;font:600 13px Inter,sans-serif;cursor:pointer}
        .steal-settings-launcher:hover{background:#27272a;transform:translateY(-2px)}
        .steal-settings-backdrop{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:20px;background:#000b;backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:.2s}
        .steal-settings-backdrop.is-open{opacity:1;visibility:visible}
        .steal-settings-window{width:min(600px,100%);max-height:min(88vh,800px);overflow:auto;border:1px solid #3f3f46;border-radius:18px;background:#111113;color:#f4f4f5;box-shadow:0 24px 80px #000b;font-family:Inter,sans-serif;transform:scale(.99);transition:.2s}
        .steal-settings-backdrop.is-open .steal-settings-window{transform:scale(1)}
        .steal-settings-titlebar{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:15px 20px;background:#090909;border-bottom:1px solid #27272a}
        .steal-settings-close,.steal-settings-action{border:1px solid #52525b;border-radius:9px;background:#27272a;color:#e4e4e7;font:600 12px Inter,sans-serif;cursor:pointer}
        .steal-settings-close{width:34px;height:34px;font-size:20px}.steal-settings-action{padding:8px 11px}.steal-settings-action:hover{background:#3f3f46}
        .steal-settings-content{padding:22px}.steal-settings-content h2{margin:0 0 6px;font:600 20px Inter,sans-serif}.steal-settings-intro{margin:0 0 18px;color:#a1a1aa;font:14px/1.5 Inter,sans-serif}
        .steal-settings-section{margin-top:20px}.steal-settings-section h3{margin:0 0 9px;color:#d4d4d8;font:600 11px Inter,sans-serif;text-transform:uppercase;letter-spacing:.1em}
        .steal-settings-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:8px;padding:13px;border:1px solid #2a2a2e;border-radius:12px;background:#19191c;font:13px Inter,sans-serif}
        .steal-settings-row strong{display:block;color:#f4f4f5}.steal-settings-row small{display:block;margin-top:4px;color:#a1a1aa;line-height:1.4}
        .steal-settings-control{max-width:180px;padding:8px 10px;border:1px solid #52525b;border-radius:9px;background:#101014;color:#f4f4f5;font:12px Inter,sans-serif}
        .steal-settings-confirm{position:fixed;inset:0;z-index:70;display:none;place-items:center;padding:20px;background:#000a}.steal-settings-confirm.is-open{display:grid}.steal-settings-confirm-box{width:min(390px,100%);padding:22px;border:1px solid #52525b;border-radius:16px;background:#18181b;color:#f4f4f5;font:14px/1.5 Inter,sans-serif}
        @media(max-width:520px){.steal-settings-row{align-items:flex-start;flex-direction:column}.steal-settings-control{max-width:none;width:100%}}
        html.steal-reduced-motion *,html.steal-reduced-motion *:before,html.steal-reduced-motion *:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
    `;
    document.head.appendChild(style);

    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'steal-settings-launcher';
    launcher.setAttribute('aria-label', 'Open Steal a Song settings');
    launcher.innerHTML = '<span aria-hidden="true">⚙</span><span>Settings</span>';

    const backdrop = document.createElement('div');
    backdrop.className = 'steal-settings-backdrop';
    backdrop.innerHTML = `
      <section class="steal-settings-window" role="dialog" aria-modal="true" aria-labelledby="steal-settings-heading">
        <header class="steal-settings-titlebar"><span style="color:#a1a1aa;font-size:12px">Steal a Song Preferences</span><button type="button" class="steal-settings-close" aria-label="Close settings">×</button></header>
        <div class="steal-settings-content">
          <h2 id="steal-settings-heading">Settings</h2><p class="steal-settings-intro">Personalize Steal a Song. Preferences are saved in this browser.</p>
          <div class="steal-settings-section"><h3>Accessibility</h3>
            <div class="steal-settings-row"><div><strong>Reduce motion</strong><small>Limit decorative animation and transitions.</small></div><button type="button" id="steal-motion" class="steal-settings-action">Enable</button></div>
          </div>
          <div class="steal-settings-section"><h3>Playback</h3>
            <div class="steal-settings-row"><div><strong>Visualizer</strong><small>Choose the display used by the audio deck.</small></div><select id="steal-visualizer" class="steal-settings-control"><option value="bars">Spectrum</option><option value="wave">Waveform</option><option value="mirror">Dual mirror</option></select></div>
            <div class="steal-settings-row"><div><strong>Track crossfade</strong><small>Default transition duration between tracks.</small></div><select id="steal-crossfade" class="steal-settings-control"><option value="0">Off</option><option value="1">1 second</option><option value="2">2 seconds</option><option value="3">3 seconds</option><option value="4">4 seconds</option><option value="5">5 seconds</option><option value="6">6 seconds</option><option value="7">7 seconds</option><option value="8">8 seconds</option></select></div>
            <div class="steal-settings-row"><div><strong>Default volume</strong><small>Volume used when opening Steal a Song.</small></div><select id="steal-volume" class="steal-settings-control"><option value="25">25%</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option><option value="125">125%</option><option value="150">150%</option></select></div>
          </div>
          <div class="steal-settings-section"><h3>Local music library</h3>
            <div class="steal-settings-row"><div><strong>Browser storage</strong><small id="steal-storage">Checking local storage…</small></div><button type="button" id="steal-refresh" class="steal-settings-action">Refresh</button></div>
            <div class="steal-settings-row"><div><strong>Clear saved library</strong><small>Remove uploaded tracks and playlists saved in this browser.</small></div><button type="button" id="steal-clear" class="steal-settings-action">Clear library</button></div>
            <div class="steal-settings-row"><div><strong>Reset preferences</strong><small>Restore settings to their defaults. Your music library stays.</small></div><button type="button" id="steal-reset" class="steal-settings-action">Reset</button></div>
          </div>
        </div>
      </section>`;

    const confirm = document.createElement('div');
    confirm.className = 'steal-settings-confirm';
    confirm.innerHTML = '<section class="steal-settings-confirm-box" role="alertdialog" aria-modal="true"><strong>Clear saved music?</strong><p>This permanently removes the locally saved tracks and playlists.</p><div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="steal-settings-action" id="steal-clear-cancel">Cancel</button><button type="button" class="steal-settings-action" id="steal-clear-confirm">Clear library</button></div></section>';
    document.body.append(launcher, backdrop, confirm);

    function readPrefs(){try{const p=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return p&&typeof p==='object'?p:{}}catch(_){return{}}}
    function savePrefs(key,value){const p=readPrefs();p[key]=value;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(p))}catch(_){}}

    const close = backdrop.querySelector('.steal-settings-close');
    const motion = backdrop.querySelector('#steal-motion');
    const visualizer = backdrop.querySelector('#steal-visualizer');
    const crossfade = backdrop.querySelector('#steal-crossfade');
    const volume = backdrop.querySelector('#steal-volume');
    const storage = backdrop.querySelector('#steal-storage');
    let previousFocus=null;

    function open(){previousFocus=document.activeElement;backdrop.classList.add('is-open');document.body.style.overflow='hidden';close.focus();refreshStorage()}
    function closePanel(){backdrop.classList.remove('is-open');document.body.style.overflow='';if(previousFocus?.focus)previousFocus.focus()}

    async function refreshStorage(){if(!navigator.storage?.estimate){storage.textContent='Storage estimate unavailable.';return}try{const e=await navigator.storage.estimate();const mb=n=>`${(n/1048576).toFixed(1)} MB`;storage.textContent=`${mb(e.usage||0)} used · ${mb(e.quota||0)} available`}catch(_){storage.textContent='Could not read browser storage.'}}

    launcher.addEventListener('click',open); close.addEventListener('click',closePanel);
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)closePanel()});
    backdrop.querySelector('#steal-refresh').addEventListener('click',refreshStorage);

    motion.addEventListener('click',()=>{const enabled=!document.documentElement.classList.contains('steal-reduced-motion');document.documentElement.classList.toggle('steal-reduced-motion',enabled);motion.textContent=enabled?'Disable':'Enable';savePrefs('reducedMotion',enabled)});
    visualizer.addEventListener('change',()=>{savePrefs('visualizer',visualizer.value);document.querySelector(`.viz-mode-btn[data-viz="${visualizer.value}"]`)?.click()});
    crossfade.addEventListener('change',()=>{savePrefs('crossfade',crossfade.value);const slider=document.getElementById('crossfade-slider');if(slider){slider.value=crossfade.value;slider.dispatchEvent(new Event('input',{bubbles:true}))}});
    volume.addEventListener('change',()=>{savePrefs('defaultVolume',volume.value);const slider=document.getElementById('volume-slider');if(slider){slider.value=volume.value/100;slider.dispatchEvent(new Event('input',{bubbles:true}))}});

    backdrop.querySelector('#steal-reset').addEventListener('click',()=>{try{localStorage.removeItem(STORAGE_KEY)}catch(_){}});
    backdrop.querySelector('#steal-clear').addEventListener('click',()=>confirm.classList.add('is-open'));
    confirm.querySelector('#steal-clear-cancel').addEventListener('click',()=>confirm.classList.remove('is-open'));
    confirm.querySelector('#steal-clear-confirm').addEventListener('click',()=>{const request=indexedDB.deleteDatabase(DB_NAME);request.onsuccess=()=>location.reload();request.onerror=()=>{storage.textContent='Could not clear the library.';confirm.classList.remove('is-open')};request.onblocked=()=>{storage.textContent='Close other Steal a Song tabs before clearing.';confirm.classList.remove('is-open')}});

    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key===','){e.preventEvent?.();backdrop.classList.contains('is-open')?closePanel():open()}if(e.key==='Escape')backdrop.classList.contains('is-open')&&closePanel()});

    const prefs=readPrefs();
    document.documentElement.classList.toggle('steal-reduced-motion',prefs.reducedMotion===true);motion.textContent=prefs.reducedMotion?'Disable':'Enable';
    visualizer.value=prefs.visualizer||'bars';crossfade.value=prefs.crossfade||'0';volume.value=['25','50','75','100','125','150'].includes(String(prefs.defaultVolume))?String(prefs.defaultVolume):'100';

    // Replace lines 107–116 with:
function renameApp(root = document) {
    if (document.title.includes('AetherStudio') || document.title.includes('AtherStudio')) {
        document.title = 'Steal a Song — Local Audio Remix & DJ Deck';
    }

    const title = document.querySelector('h1');
    if (title && /(AetherStudio|AtherStudio)/i.test(title.textContent)) {
        title.textContent = 'Steal a Song';
    }

    if (root.nodeType === Node.TEXT_NODE) {
        root.nodeValue = root.nodeValue.replace(/AetherStudio|AtherStudio/g, 'Steal a Song');
        return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        walker.currentNode.nodeValue =
            walker.currentNode.nodeValue.replace(/AetherStudio|AtherStudio/g, 'Steal a Song');
    }
}

renameApp();

new MutationObserver(records => {
    for (const record of records) {
        if (record.type === 'characterData') {
            if (/AetherStudio|AtherStudio/.test(record.target.nodeValue)) {
                renameApp(record.target);
            }
        } else {
            record.addedNodes.forEach(node => renameApp(node));
        }
    }
}).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
});
