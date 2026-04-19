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
    // RESERVE — open the BOOK NOW popup card
    // ------------------------------------------------------------------
    function setupReserve() {
        var trigger  = document.querySelector('.reserveinteractiontrigger');
        var card     = document.querySelector('.reservecard');
        var blackout = document.querySelector('.reserveblackoverlay');
        var closeBtn = document.querySelector('.rerserveclosebutton');
        if (!trigger || !card) return;

        var isOpen = false;

        // Remember original parents so we can restore on close.
        var cardOrigParent     = card.parentNode;
        var cardOrigNext       = card.nextSibling;
        var blackoutOrigParent = blackout ? blackout.parentNode : null;
        var blackoutOrigNext   = blackout ? blackout.nextSibling : null;

        // Force popup layout when parked at <body> (escapes transformed ancestors)
        function pin(el) {
            el.style.position = 'fixed';
            el.style.top = '0';
            el.style.left = '0';
            el.style.right = '0';
            el.style.bottom = '0';
            el.style.width = '100vw';
            el.style.height = '100vh';
            el.style.margin = '0';
        }
        function centerCard(el) {
            el.style.position = 'fixed';
            el.style.top = '50%';
            el.style.left = '50%';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            el.style.transform = 'translate(-50%, -50%)';
            el.style.maxWidth = '60rem';
            el.style.width = 'min(60rem, 92vw)';
            el.style.margin = '0';
        }

        // Initial hidden state
        gsap.set(card,     { autoAlpha: 0, display: 'none' });
        if (blackout) gsap.set(blackout, { autoAlpha: 0, display: 'none' });

        function open() {
            if (isOpen) return;
            isOpen = true;
            document.body.style.overflow = 'hidden';

            // Move into body to escape the .main transform context
            if (blackout) {
                document.body.appendChild(blackout);
                pin(blackout);
                blackout.style.zIndex = '10000';
                blackout.style.display = 'block';
                gsap.to(blackout, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
            }

            document.body.appendChild(card);
            centerCard(card);
            card.style.zIndex = '10001';
            card.style.display = 'flex';

            // Reveal inner card sections that were saved with IX2 opacity:0 state
            var top    = card.querySelector('.reservecardtop');
            var bottom = card.querySelector('.reservecardbottom');
            if (top)    gsap.set(top,    { clearProps: 'transform' });
            if (bottom) gsap.set(bottom, { clearProps: 'transform' });
            if (top)    { top.style.opacity = ''; top.style.transform = ''; }
            if (bottom) { bottom.style.opacity = ''; bottom.style.transform = ''; }

            // Simple fade + scale-in; translate(-50%,-50%) kept via CSS
            card.style.transform = 'translate(-50%, -50%) scale(0.97)';
            gsap.set(card, { autoAlpha: 0 });

            var tl = gsap.timeline();
            tl.to(card, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0);
            tl.fromTo(card, { '--pop-scale': 0.97 }, { '--pop-scale': 1, duration: 0.5, ease: 'power3.out',
                onUpdate: function () {
                    var s = gsap.getProperty(card, '--pop-scale') || 1;
                    card.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
                }
            }, 0);
            if (top) tl.fromTo(top,
                { opacity: 0, y: '3rem', rotate: -5 },
                { opacity: 1, y: 0, rotate: 0, duration: 0.55, ease: 'power2.out' }, 0.1);
            if (bottom) tl.fromTo(bottom,
                { opacity: 0, y: '4rem', rotate: 5 },
                { opacity: 1, y: 0, rotate: 0, duration: 0.55, ease: 'power2.out' }, 0.2);
        }
        function close() {
            if (!isOpen) return;
            isOpen = false;
            document.body.style.overflow = '';

            gsap.to(card, { autoAlpha: 0, duration: 0.3, ease: 'power2.in',
                onComplete: function () {
                    card.style.display = 'none';
                    // Restore DOM position
                    card.style.cssText = '';
                    if (cardOrigParent) cardOrigParent.insertBefore(card, cardOrigNext);
                } });
            if (blackout) gsap.to(blackout, { autoAlpha: 0, duration: 0.3, ease: 'power2.in',
                onComplete: function () {
                    blackout.style.display = 'none';
                    blackout.style.cssText = '';
                    if (blackoutOrigParent) blackoutOrigParent.insertBefore(blackout, blackoutOrigNext);
                } });
        }

        document.addEventListener('click', function (e) {
            // Open from nav trigger or from menu-overlay Prenota link
            if (!isOpen && (e.target.closest('.reserveinteractiontrigger') ||
                            e.target.closest('[data-prenota-popup]'))) {
                e.preventDefault();
                e.stopPropagation();
                // If the menu overlay is open, close it first for a clean transition
                if (window.__menu && typeof window.__menu.close === 'function') {
                    try { window.__menu.close(); } catch (_) {}
                }
                setTimeout(open, 350);
                return;
            }
            // Close button
            if (isOpen && e.target.closest('.rerserveclosebutton')) {
                e.preventDefault();
                close();
                return;
            }
            // Backdrop click
            if (isOpen && e.target === blackout) {
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

