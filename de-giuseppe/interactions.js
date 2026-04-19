// Interactions — reproduces the Webflow IX2 animations that aren't bundled
// in the saved HTML: full-screen menu open/close, reservation card toggle.

(function () {
    function init() {
        if (typeof gsap === 'undefined') return;

        setupMenu();
        setupReserve();
    }

    // ------------------------------------------------------------------
    // MENU overlay
    // ------------------------------------------------------------------
    function setupMenu() {
        var trigger = document.querySelector('.menuwrap');
        var overlay = document.querySelector('.mainwrapmenu .menu');
        var panel   = document.querySelector('.mainwrapmenu .menucontent');
        var closeBtn = document.querySelector('.menuclosebutton');
        if (!trigger || !overlay) return;

        var linkWraps = overlay.querySelectorAll('.menulinkwrap');
        var bullets   = overlay.querySelectorAll('.menubulletpointwrap');
        var texts     = overlay.querySelectorAll('.menulink');
        var bottom    = overlay.querySelector('.menucontentbottom');
        var isOpen = false;

        // Prepare hidden state
        gsap.set(overlay, { display: 'none', autoAlpha: 0 });
        if (panel) gsap.set(panel, { xPercent: -100 });
        gsap.set(bullets, { x: '-2rem', rotateZ: -60 });
        gsap.set(texts,   { x: '-1rem', opacity: 0 });
        if (bottom) gsap.set(bottom, { opacity: 0, y: '1.5rem' });

        var openTl = gsap.timeline({ paused: true, onStart: function () {
            overlay.style.display = 'flex';
        }});
        openTl
            .to(overlay, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }, 0)
            .to(panel,   { xPercent: 0, duration: 0.65, ease: 'osmo' }, 0)
            .to(bullets, { x: '0rem', rotateZ: 0, duration: 0.5, stagger: 0.05, ease: 'osmo' }, 0.2)
            .to(texts,   { x: '0rem', opacity: 1, duration: 0.5, stagger: 0.05, ease: 'osmo' }, 0.22)
            .to(bottom || {}, bottom ? { opacity: 1, y: 0, duration: 0.4, ease: 'osmo' } : {}, 0.45);

        function open() {
            if (isOpen) return;
            isOpen = true;
            document.body.style.overflow = 'hidden';
            openTl.invalidate().restart();
        }
        function close() {
            if (!isOpen) return;
            isOpen = false;
            document.body.style.overflow = '';
            gsap.timeline({ onComplete: function () { overlay.style.display = 'none'; } })
                .to(bottom || {}, bottom ? { opacity: 0, y: '1.5rem', duration: 0.25, ease: 'power2.in' } : {}, 0)
                .to(texts,   { x: '-1rem', opacity: 0, duration: 0.35, stagger: 0.03, ease: 'power2.in' }, 0)
                .to(bullets, { x: '-2rem', rotateZ: -60, duration: 0.35, stagger: 0.03, ease: 'power2.in' }, 0)
                .to(panel,   { xPercent: -100, duration: 0.5, ease: 'osmo' }, 0.15)
                .to(overlay, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 0.4);
        }

        trigger.style.cursor = 'pointer';
        trigger.addEventListener('click', function (e) {
            e.preventDefault();
            open();
        });

        if (closeBtn) {
            closeBtn.style.cursor = 'pointer';
            closeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                close();
            });
        }

        // Click backdrop (overlay bg) to close
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });

        // Escape key closes
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) close();
        });

        // Close when clicking any menu link (navigate)
        overlay.querySelectorAll('.menulinkwrap').forEach(function (a) {
            a.addEventListener('click', function () { setTimeout(close, 50); });
        });
    }

    // ------------------------------------------------------------------
    // RESERVE card
    // ------------------------------------------------------------------
    function setupReserve() {
        var trigger = document.querySelector('.reserveinteractiontrigger');
        var card    = document.querySelector('.reservecard');
        var overlay = document.querySelector('.reserveblackoverlay');
        var closeBtn = document.querySelector('.rerserveclosebutton');
        if (!trigger || !card) return;

        var isOpen = false;

        gsap.set(card,    { display: 'none', autoAlpha: 0, y: '2rem' });
        if (overlay) gsap.set(overlay, { display: 'none', autoAlpha: 0 });

        function open() {
            if (isOpen) return;
            isOpen = true;
            document.body.style.overflow = 'hidden';
            if (overlay) {
                overlay.style.display = 'block';
                gsap.to(overlay, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
            }
            card.style.display = 'flex';
            gsap.fromTo(card,
                { autoAlpha: 0, y: '2rem' },
                { autoAlpha: 1, y: 0, duration: 0.55, ease: 'osmo' }
            );
        }
        function close() {
            if (!isOpen) return;
            isOpen = false;
            document.body.style.overflow = '';
            gsap.to(card, { autoAlpha: 0, y: '2rem', duration: 0.35, ease: 'power2.in', onComplete: function () { card.style.display = 'none'; }});
            if (overlay) gsap.to(overlay, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: function () { overlay.style.display = 'none'; }});
        }

        trigger.style.cursor = 'pointer';
        trigger.addEventListener('click', function (e) {
            e.preventDefault();
            open();
        });
        if (closeBtn) {
            closeBtn.style.cursor = 'pointer';
            closeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                close();
            });
        }
        if (overlay) {
            overlay.addEventListener('click', close);
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) close();
        });
    }

    // Run after GSAP is ready. pagetransition.js is loaded after us and sets
    // up `osmo` custom ease; so defer init until DOM + libs are parsed.
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // Small delay so gsap + CustomEase have registered
        setTimeout(init, 50);
    } else {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 50); });
    }
})();
