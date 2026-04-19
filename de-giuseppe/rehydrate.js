// Rehydrate.js — undo the "already-initialized" state saved in the HTML
// so pagetransition.js can re-run its animations fresh (marquee, SplitText,
// dividers, parallax).

(function () {
    // 1) Heading / meta / hero-heading SplitText markup: collapse nested
    //    per-char <div>s back to plain text so SplitText can re-split.
    var splitSelectors = [
        '[heading-animation]',
        '[meta-animation]',
        '[heading-hero-animation]'
    ];
    document.querySelectorAll(splitSelectors.join(',')).forEach(function (el) {
        // The saved markup wraps text as: <div><div>W</div><div>o</div>...</div>
        // textContent collapses it; we restore innerHTML to that flat text
        // preserving single spaces between words.
        var text = el.textContent.replace(/\s+/g, ' ').trim();
        el.innerHTML = text;
        el.removeAttribute('aria-label');
        delete el.dataset.headingAnimationInitialized;
        delete el.dataset.metaAnimationInitialized;
        delete el.dataset.heroHeadingAnimationInitialized;
    });

    // 2) Heading-marquee: the init doubles the track's inner HTML. Since the
    //    snapshot was taken after that doubling, keep only the first set.
    document.querySelectorAll('[heading-move-wrap] [heading-move]').forEach(function (track) {
        var sets = track.querySelectorAll('.headingset');
        for (var i = 1; i < sets.length; i++) sets[i].remove();
        track.removeAttribute('style');
        delete track.dataset.marqueeInitialized;
    });

    // 3) Dividers animated via scaleX: strip transform styles + flag.
    document.querySelectorAll('[divider-animation]').forEach(function (el) {
        el.removeAttribute('style');
        delete el.dataset.dividerAnimationInitialized;
    });
    document.querySelectorAll('[data-divider-animation-initialized]').forEach(function (el) {
        delete el.dataset.dividerAnimationInitialized;
    });

    // 4) Parallax images: strip the initialized flag so ScrollTrigger can
    //    re-create the tween. Keep inline transforms (they get overwritten).
    document.querySelectorAll('.image-content-parralax .image-content').forEach(function (el) {
        delete el.dataset.parallaxInitialized;
    });
    document.querySelectorAll('[data-parallax-initialized]').forEach(function (el) {
        delete el.dataset.parallaxInitialized;
    });

    // 5) Barba container: the snapshot has the final post-enter transform
    //    inline. Reset to let runPageOnceAnimation drive the entry animation.
    var container = document.querySelector('[data-barba="container"]');
    if (container) container.removeAttribute('style');
})();
