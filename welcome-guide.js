/* NM Audio first-run welcome guide and reusable tutorial. */
(() => {
    'use strict';

    const PREFS_KEY = 'nm-audio-preferences';
    const GUIDE_KEY = 'welcomeGuideDismissed';

    function readPrefs() {
        try {
            const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
            return prefs && typeof prefs === 'object' ? prefs : {};
        } catch (_) {
            return {};
        }
    }

    function saveDismissed(value) {
        const prefs = readPrefs();
        prefs[GUIDE_KEY] = value;
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        } catch (_) {
            // The guide still works when browser storage is unavailable.
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        .nm-guide-backdrop{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);opacity:0;visibility:hidden;transition:opacity .2s ease,visibility .2s ease}
        .nm-guide-backdrop.is-open{opacity:1;visibility:visible}
        .nm-guide-dialog{box-sizing:border-box;width:min(560px,100%);max-height:min(88vh,720px);overflow:auto;border:1px solid #3f3f46;border-radius:20px;background:linear-gradient(145deg,#18181b,#101014);color:#f4f4f5;box-shadow:0 28px 90px #000b;font:14px/1.55 Inter,system-ui,sans-serif;transform:translateY(10px) scale(.98);transition:transform .2s ease}
        .nm-guide-backdrop.is-open .nm-guide-dialog{transform:translateY(0) scale(1)}
        .nm-guide-content{padding:28px}
        .nm-guide-eyebrow{margin:0 0 8px;color:#67e8f9;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
        .nm-guide-title{margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:-.03em}
        .nm-guide-intro{margin:8px 0 22px;color:#a1a1aa}
        .nm-guide-steps{display:grid;gap:10px;margin:0;padding:0;list-style:none}
        .nm-guide-step{display:flex;gap:13px;padding:13px;border:1px solid #2a2a2e;border-radius:13px;background:#19191c}
        .nm-guide-number{display:grid;flex:0 0 28px;width:28px;height:28px;place-items:center;border-radius:9px;background:#164e63;color:#a5f3fc;font-size:12px;font-weight:700}
        .nm-guide-step strong{display:block;color:#f4f4f5;font-size:13px}
        .nm-guide-step p{margin:3px 0 0;color:#a1a1aa;font-size:12px}
        .nm-guide-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:22px;padding-top:18px;border-top:1px solid #27272a}
        .nm-guide-checkbox{display:flex;align-items:center;gap:9px;color:#d4d4d8;font-size:12px;cursor:pointer}
        .nm-guide-checkbox input{width:16px;height:16px;accent-color:#06b6d4}
        .nm-guide-continue{margin-left:auto;padding:10px 19px;border:0;border-radius:11px;background:linear-gradient(110deg,#0891b2,#2563eb);color:#fff;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 22px #0891b233}
        .nm-guide-continue:hover{filter:brightness(1.12)}
        .nm-guide-continue:focus-visible,.nm-guide-checkbox input:focus-visible,.nm-guide-settings-button:focus-visible{outline:2px solid #67e8f9;outline-offset:3px}
        .nm-guide-settings-button{padding:8px 11px;border:1px solid #52525b;border-radius:9px;background:#27272a;color:#e4e4e7;font:600 12px Inter,sans-serif;cursor:pointer}
        .nm-guide-settings-button:hover{background:#3f3f46}
        @media(max-width:480px){.nm-guide-content{padding:22px}.nm-guide-title{font-size:23px}.nm-guide-footer{align-items:flex-start;flex-wrap:wrap}.nm-guide-continue{margin-left:auto}}
        @media(prefers-reduced-motion:reduce){.nm-guide-backdrop,.nm-guide-dialog{transition:none}}
    `;
    document.head.appendChild(style);

    const backdrop = document.createElement('div');
    backdrop.className = 'nm-guide-backdrop';
    backdrop.innerHTML = `
        <section class="nm-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="nm-guide-title" aria-describedby="nm-guide-intro">
            <div class="nm-guide-content">
                <p class="nm-guide-eyebrow">NM Audio · Getting started</p>
                <h2 class="nm-guide-title" id="nm-guide-title">Welcome to your audio studio</h2>
                <p class="nm-guide-intro" id="nm-guide-intro">A quick tour to help you start listening, mixing, and making the sound your own.</p>
                <ol class="nm-guide-steps">
                    <li class="nm-guide-step"><span class="nm-guide-number">1</span><div><strong>Add your music</strong><p>Choose <b>Add Music</b> or drop audio files into the library. Your music stays in this browser.</p></div></li>
                    <li class="nm-guide-step"><span class="nm-guide-number">2</span><div><strong>Build a playlist and play</strong><p>Select a track in the library, then use the playback controls and scrubber to listen.</p></div></li>
                    <li class="nm-guide-step"><span class="nm-guide-number">3</span><div><strong>Shape your mix</strong><p>Try a one-click style preset, or adjust speed, pitch, reverb, stereo, EQ, and filters.</p></div></li>
                    <li class="nm-guide-step"><span class="nm-guide-number">4</span><div><strong>Save your remix</strong><p>When you are happy with the sound, use <b>Export Remix (.WAV)</b> to download it.</p></div></li>
                </ol>
                <div class="nm-guide-footer">
                    <label class="nm-guide-checkbox" id="nm-guide-checkbox-label"><input type="checkbox" id="nm-guide-dont-show"><span>Don't show this again</span></label>
                    <button class="nm-guide-continue" type="button" id="nm-guide-continue">Continue</button>
                </div>
            </div>
        </section>`;
    document.body.appendChild(backdrop);

    const checkboxLabel = backdrop.querySelector('#nm-guide-checkbox-label');
    const checkbox = backdrop.querySelector('#nm-guide-dont-show');
    const continueButton = backdrop.querySelector('#nm-guide-continue');
    let previousFocus = null;
    let previousOverflow = '';

    function closeGuide() {
        backdrop.classList.remove('is-open');
        document.body.style.overflow = previousOverflow;
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    }

    function openWelcomeGuide({ showDontShowAgain = true } = {}) {
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        checkboxLabel.hidden = !showDontShowAgain;
        checkbox.checked = false;
        backdrop.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        continueButton.focus();
    }

    checkbox.addEventListener('change', () => saveDismissed(checkbox.checked));
    continueButton.addEventListener('click', closeGuide);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && backdrop.classList.contains('is-open')) closeGuide();
    });

    // Make the same guide available from Settings, without the first-run checkbox.
    const librarySection = document.querySelector('.steal-settings-section:has(#steal-clear)');
    if (librarySection) {
        const row = document.createElement('div');
        row.className = 'steal-settings-row';
        row.innerHTML = '<div><strong>Getting started</strong><small>Open the NM Audio welcome guide again.</small></div><button type="button" class="nm-guide-settings-button">Open guide</button>';
        row.querySelector('button').addEventListener('click', () => openWelcomeGuide({ showDontShowAgain: false }));
        librarySection.appendChild(row);
    }

    window.openWelcomeGuide = openWelcomeGuide;

    if (readPrefs()[GUIDE_KEY] !== true) {
        // Defer until layout/scripts have completed so the welcome dialog can take focus safely.
        requestAnimationFrame(() => openWelcomeGuide({ showDontShowAgain: true }));
    }
})();
