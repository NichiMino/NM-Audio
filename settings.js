/* Settings panel for AetherStudio.
 * Include with <script src="settings.js" defer></script>.
 */
(() => {
    const styles = `
        .aether-settings-launcher {
            position: fixed; left: 20px; bottom: 20px; z-index: 40;
            display: inline-flex; align-items: center; gap: 10px;
            padding: 12px 18px; border: 1px solid #52525b; border-radius: 12px;
            background: #3f3f46; color: #f4f4f5; font: 600 13px Inter, sans-serif;
            box-shadow: 0 8px 24px #0006; cursor: pointer;
            transition: background .2s, transform .2s, border-color .2s;
        }
        .aether-settings-launcher:hover { background: #52525b; border-color: #71717a; transform: translateY(-2px); }
        .aether-settings-launcher:focus-visible, .aether-settings-close:focus-visible { outline: 2px solid #22d3ee; outline-offset: 3px; }
        .aether-settings-backdrop {
            position: fixed; inset: 0; z-index: 60; display: grid; place-items: center;
            padding: 20px; background: rgb(0 0 0 / 68%); backdrop-filter: blur(6px);
            opacity: 0; visibility: hidden; transition: opacity .25s ease, visibility .25s ease;
        }
        .aether-settings-backdrop.is-open { opacity: 1; visibility: visible; }
        .aether-settings-window {
            width: min(520px, 100%); min-height: 300px; overflow: hidden;
            border: 1px solid #3f3f46; border-radius: 18px; background: #16161d;
            color: #f4f4f5; box-shadow: 0 24px 80px #000a;
            transform: translateY(28px) scale(.96); opacity: 0;
            transition: transform .32s cubic-bezier(.2,.8,.2,1), opacity .25s ease;
        }
        .aether-settings-backdrop.is-open .aether-settings-window { transform: translateY(0) scale(1); opacity: 1; }
        .aether-settings-titlebar { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:#101014; border-bottom:1px solid #2a2a38; }
        .aether-settings-dots { display:flex; gap:7px; }
        .aether-settings-dots i { width:9px; height:9px; border-radius:50%; background:#52525b; }
        .aether-settings-dots i:first-child { background:#fb7185; }
        .aether-settings-dots i:nth-child(2) { background:#fbbf24; }
        .aether-settings-dots i:nth-child(3) { background:#34d399; }
        .aether-settings-close { display:grid; place-items:center; width:32px; height:32px; border:0; border-radius:8px; background:#27272a; color:#d4d4d8; font-size:20px; cursor:pointer; }
        .aether-settings-content { padding:24px; }
        .aether-settings-content h2 { margin:0 0 8px; font:600 20px Inter,sans-serif; }
        .aether-settings-content p { margin:0; color:#a1a1aa; font:14px/1.6 Inter,sans-serif; }
        .aether-settings-row { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:22px; padding:14px; border:1px solid #2a2a38; border-radius:12px; background:#101014; font:13px Inter,sans-serif; }
        .aether-settings-row span { color:#a1a1aa; }
        @media (prefers-reduced-motion: reduce) { .aether-settings-launcher, .aether-settings-backdrop, .aether-settings-window { transition:none; } }
    `;

    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);

    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'aether-settings-launcher';
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = '<span aria-hidden="true">⚙</span><span>Settings</span>';

    const backdrop = document.createElement('div');
    backdrop.className = 'aether-settings-backdrop';
    backdrop.innerHTML = `
        <section class="aether-settings-window" role="dialog" aria-modal="true" aria-labelledby="aether-settings-heading">
            <header class="aether-settings-titlebar">
                <div class="aether-settings-dots" aria-hidden="true"><i></i><i></i><i></i></div>
                <span style="color:#a1a1aa;font:12px Inter,sans-serif">AetherStudio · Settings</span>
                <button type="button" class="aether-settings-close" aria-label="Close settings">×</button>
            </header>
            <div class="aether-settings-content">
                <h2 id="aether-settings-heading">Settings</h2>
                <p>Your studio settings screen is ready. More preferences can be added here.</p>
                <div class="aether-settings-row"><strong>Studio interface</strong><span>Dark mode</span></div>
                <div class="aether-settings-row"><strong>Audio processing</strong><span>Local to this device</span></div>
            </div>
        </section>`;

    document.body.append(launcher, backdrop);
    const closeButton = backdrop.querySelector('.aether-settings-close');
    let previousFocus = null;

    function closeSettings() {
        backdrop.classList.remove('is-open');
        launcher.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        if (previousFocus) previousFocus.focus();
    }

    launcher.addEventListener('click', () => {
        previousFocus = document.activeElement;
        backdrop.classList.add('is-open');
        launcher.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        closeButton.focus();
    });
    closeButton.addEventListener('click', closeSettings);
    backdrop.addEventListener('click', event => {
        if (event.target === backdrop) closeSettings();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && backdrop.classList.contains('is-open')) closeSettings();
    });
})();
