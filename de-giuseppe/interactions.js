// Interactions — reproduces the Webflow IX2 animations that aren't bundled
// in the saved HTML: full-screen menu open/close, reservation card toggle.

(function () {
    var log = function () {};
    // Uncomment for debugging:
    // log = console.log.bind(console, '[interactions]');

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        // Defer a tick so pagetransition.js has registered osmo ease
        setTimeout(function () {
            if (typeof gsap === 'undefined') {
                console.warn('[interactions] GSAP not loaded');
                return;
            }
            setupMenu();
            setupReserve();
        }, 60);
    });

    // ------------------------------------------------------------------
    // MENU overlay
    // ------------------------------------------------------------------
    function setupMenu() {
        var trigger     = document.querySelector('.menuwrap');
        var overlay     = document.querySelector('.mainwrapmenu .menu');
        var closeBtn    = document.querySelector('.menuclosebutton');
        var mainwrap    = document.querySelector('.mainwrap');
        var mainwrapmenu = document.querySelector('.mainwrapmenu');

        log('menu setup', { trigger: !!trigger, overlay: !!overlay, mainwrap: !!mainwrap });
        if (!trigger || !overlay || !mainwrap) return;

        var isOpen = false;

        // Initial state: menu hidden (display none), mainwrapmenu sits behind.
        gsap.set(overlay, { autoAlpha: 0, display: 'none' });

        function open() {
            if (isOpen) return;
            isOpen = true;
            log('open');
            document.body.style.overflow = 'hidden';

            // Park mainwrapmenu BEHIND the mainwrap, filling the viewport, so
            // when mainwrap tilts/translates away, the menu below is revealed.
            if (mainwrapmenu) {
                mainwrapmenu.style.position = 'fixed';
                mainwrapmenu.style.top = '0';
                mainwrapmenu.style.left = '0';
                mainwrapmenu.style.right = '0';
                mainwrapmenu.style.bottom = '0';
                mainwrapmenu.style.zIndex = '1';
            }
            // Lift mainwrap onto its own stacking context above the menu.
            mainwrap.style.position = 'relative';
            mainwrap.style.zIndex = '5';

            // Make menu visible (it's behind mainwrap until mainwrap moves).
            overlay.style.display = 'flex';
            gsap.set(overlay, { autoAlpha: 1 });

            // Animate mainwrap: slide right + tilt clockwise, revealing menu.
            gsap.set(mainwrap, { transformOrigin: '50% 0%', willChange: 'transform' });
            gsap.to(mainwrap, {
                x: '65%',
                y: '2rem',
                rotation: 6,
                duration: 0.7,
                ease: 'power2.inOut'
            });
        }
        function close() {
            if (!isOpen) return;
            isOpen = false;
            log('close');
            document.body.style.overflow = '';

            gsap.to(mainwrap, {
                x: 0,
                y: 0,
                rotation: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: function () {
                    mainwrap.style.zIndex = '';
                    mainwrap.style.position = '';
                    if (mainwrapmenu) {
                        mainwrapmenu.style.position = '';
                        mainwrapmenu.style.top = '';
                        mainwrapmenu.style.left = '';
                        mainwrapmenu.style.right = '';
                        mainwrapmenu.style.bottom = '';
                        mainwrapmenu.style.zIndex = '';
                    }
                    overlay.style.display = 'none';
                    gsap.set(overlay, { autoAlpha: 0 });
                }
            });
        }

        // Bind via delegation on document (capture phase) so Lenis/barba
        // wrappers can't swallow the click.
        document.addEventListener('click', function (e) {
            if (!isOpen && e.target.closest('.menuwrap')) {
                e.preventDefault();
                e.stopPropagation();
                open();
                return;
            }
            if (isOpen && (e.target.closest('.menuclosebutton') || e.target === overlay)) {
                e.preventDefault();
                close();
                return;
            }
            if (isOpen && e.target.closest('.menulinkwrap')) {
                // follow link but close overlay shortly after
                setTimeout(close, 80);
            }
        }, true);

        trigger.style.cursor = 'pointer';
        if (closeBtn) closeBtn.style.cursor = 'pointer';

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) close();
        });

        // Expose for manual testing
        window.__menu = { open: open, close: close };
    }

    // ------------------------------------------------------------------
    // RESERVE card
    // ------------------------------------------------------------------
    function setupReserve() {
        var trigger  = document.querySelector('.reserveinteractiontrigger');
        var card     = document.querySelector('.reservecard');
        var blackout = document.querySelector('.reserveblackoverlay');
        var closeBtn = document.querySelector('.rerserveclosebutton');

        log('reserve setup', { trigger: !!trigger, card: !!card, blackout: !!blackout, closeBtn: !!closeBtn });
        if (!trigger || !card) return;

        var isOpen = false;

        gsap.set(card,    { autoAlpha: 0, y: '2rem', display: 'none' });
        if (blackout) gsap.set(blackout, { autoAlpha: 0, display: 'none' });

        function open() {
            if (isOpen) return;
            isOpen = true;
            document.body.style.overflow = 'hidden';
            if (blackout) {
                blackout.style.display = 'block';
                gsap.to(blackout, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
            }
            card.style.display = 'flex';
            gsap.fromTo(card,
                { autoAlpha: 0, y: '2rem' },
                { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' });
        }
        function close() {
            if (!isOpen) return;
            isOpen = false;
            document.body.style.overflow = '';
            gsap.to(card, { autoAlpha: 0, y: '2rem', duration: 0.35, ease: 'power2.in',
                onComplete: function () { card.style.display = 'none'; }});
            if (blackout) gsap.to(blackout, { autoAlpha: 0, duration: 0.3, ease: 'power2.in',
                onComplete: function () { blackout.style.display = 'none'; }});
        }

        document.addEventListener('click', function (e) {
            if (!isOpen && e.target.closest('.reserveinteractiontrigger')) {
                e.preventDefault();
                e.stopPropagation();
                open();
                return;
            }
            if (isOpen && (e.target.closest('.rerserveclosebutton') || e.target === blackout)) {
                e.preventDefault();
                close();
                return;
            }
        }, true);

        trigger.style.cursor = 'pointer';
        if (closeBtn) closeBtn.style.cursor = 'pointer';

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) close();
        });

        window.__reserve = { open: open, close: close };
    }
})();

