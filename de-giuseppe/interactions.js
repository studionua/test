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
        var trigger  = document.querySelector('.menuwrap');
        var overlay  = document.querySelector('.mainwrapmenu .menu');
        var panel    = document.querySelector('.mainwrapmenu .menucontent');
        var closeBtn = document.querySelector('.menuclosebutton');
        var mainwrapmenu = document.querySelector('.mainwrapmenu');

        log('menu setup', { trigger: !!trigger, overlay: !!overlay, panel: !!panel, closeBtn: !!closeBtn });
        if (!trigger || !overlay) return;

        var bullets = overlay.querySelectorAll('.menubulletpointwrap');
        var texts   = overlay.querySelectorAll('.menulink');
        var bottom  = overlay.querySelector('.menucontentbottom');
        var isOpen = false;

        // Prepare hidden state using GSAP (writes inline styles)
        gsap.set(overlay, { autoAlpha: 0, display: 'none', zIndex: 9999 });
        if (panel) gsap.set(panel, { xPercent: -100 });
        gsap.set(bullets, { x: '-2rem', rotate: -60, transformOrigin: '50% 50%' });
        gsap.set(texts,   { x: '-1rem', opacity: 0 });
        if (bottom) gsap.set(bottom, { opacity: 0, y: '1.5rem' });

        function open() {
            if (isOpen) return;
            isOpen = true;
            log('open');
            document.body.style.overflow = 'hidden';
            // Lift the whole mainwrapmenu above .mainwrap so the overlay isn't
            // occluded by sibling sections.
            if (mainwrapmenu) {
                mainwrapmenu.style.position = 'fixed';
                mainwrapmenu.style.top = '0';
                mainwrapmenu.style.left = '0';
                mainwrapmenu.style.right = '0';
                mainwrapmenu.style.bottom = '0';
                mainwrapmenu.style.zIndex = '9999';
            }
            overlay.style.display = 'flex';
            var tl = gsap.timeline();
            tl.to(overlay, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }, 0);
            if (panel) tl.to(panel, { xPercent: 0, duration: 0.65, ease: 'power3.out' }, 0);
            tl.to(bullets, { x: '0rem', rotate: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }, 0.2);
            tl.to(texts,   { x: '0rem', opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }, 0.22);
            if (bottom) tl.to(bottom, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.45);
        }
        function close() {
            if (!isOpen) return;
            isOpen = false;
            log('close');
            document.body.style.overflow = '';
            var tl = gsap.timeline({ onComplete: function () {
                overlay.style.display = 'none';
                if (mainwrapmenu) {
                    mainwrapmenu.style.position = '';
                    mainwrapmenu.style.top = '';
                    mainwrapmenu.style.left = '';
                    mainwrapmenu.style.right = '';
                    mainwrapmenu.style.bottom = '';
                    mainwrapmenu.style.zIndex = '';
                }
            } });
            if (bottom) tl.to(bottom, { opacity: 0, y: '1.5rem', duration: 0.25, ease: 'power2.in' }, 0);
            tl.to(texts,   { x: '-1rem', opacity: 0, duration: 0.3, stagger: 0.03, ease: 'power2.in' }, 0);
            tl.to(bullets, { x: '-2rem', rotate: -60, duration: 0.3, stagger: 0.03, ease: 'power2.in' }, 0);
            if (panel) tl.to(panel, { xPercent: -100, duration: 0.5, ease: 'power3.in' }, 0.15);
            tl.to(overlay, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 0.4);
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

