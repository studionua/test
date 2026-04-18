// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", (e) => (reducedMotion = e.matches));
rmMQ.addListener?.((e) => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });

// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  if (has("[data-insideviews]")) initInsideViewsInfinite();

  // Runs once on first load
  // if (has('[data-something]')) initSomething();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;
}

function initAfterEnterFunctions(next, data) {
  nextPage = next || document;

  resetWebflow(data);

  if (has("[heading-move-wrap]")) initHeadingMarquee();
  if (has(".image-content-parralax")) initImageContentParallax();
  if (has("[data-insideviews]")) initInsideViewsInfinite();
  if (has("[heading-animation]")) initHeadingMetaAnimation();
  if (has("[heading-hero-animation]")) initHeroHeadingMetaAnimation();

  if (hasLenis) {
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.call(() => initHeadingMarquee(next, true), null, 0);
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  gsap.set(next, {
    autoAlpha: 0,
    x: "10rem",
    y: "-10rem",
    rotation: -8,
    transformOrigin: "50% 0%",
  });

  tl.add("startEnter", 0.65);

  tl.call(() => initHeadingMarquee(next, true), null, "startEnter");

  tl.to(
    next,
    {
      x: "0rem",
      y: "0rem",
      duration: 0.7,
      ease: "back.out(2)",
    },
    "startEnter"
  );

  tl.to(
    next,
    {
      autoAlpha: 1,
      duration: 0.25,
      ease: "none",
    },
    "startEnter"
  );

  tl.to(
    next,
    {
      rotation: 0,
      duration: 0.48,
      ease: "power1.out",
    },
    "startEnter"
  );

  tl.add("pageReady", "startEnter+=0.7");
  tl.call(resetPage, [next], "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}

function runPageLeaveAnimation(current, next) {
  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    },
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  const inner = current.querySelector(".page-freeze-wrap");
  const scrollY = window.scrollY;

  if (!inner) {
    gsap.set(current, {
      transformOrigin: "50% 0%",
    });

    tl.to(current, {
      x: "-10rem",
      y: "10rem",
      rotation: 6,
      autoAlpha: 0,
      duration: 0.6,
      ease: "power1.out",
    });

    return tl;
  }

  gsap.set(current, {
    position: "fixed",
    inset: 0,
    width: "100%",
    height: window.innerHeight,
    overflow: "hidden",
    margin: 0,
    zIndex: 2,
  });

  gsap.set(inner, {
    y: -scrollY,
    transformOrigin: "50% 0%",
    width: "100%",
  });

  tl.to(inner, {
    x: "-10rem",
    y: -scrollY + 160,
    rotation: 6,
    autoAlpha: 0,
    duration: 0.6,
    ease: "power1.out",
  });

  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.call(() => initHeadingMarquee(next, true), null, 0);
    tl.call(() => initHeroHeadingMetaAnimation(next, true), null, 0);
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  gsap.set(next, {
    autoAlpha: 0,
    x: "10rem",
    y: "-10rem",
    rotation: -8,
    transformOrigin: "50% 0%",
  });

  tl.add("startEnter", 0.65);

  tl.call(() => initHeadingMarquee(next, true), null, "startEnter");
  tl.call(
    () => initHeroHeadingMetaAnimation(next, true),
    null,
    "startEnter+=0.1"
  );

  tl.to(
    next,
    {
      x: "0rem",
      y: "0rem",
      duration: 0.7,
      ease: "back.out(2)",
    },
    "startEnter"
  );

  tl.to(
    next,
    {
      autoAlpha: 1,
      duration: 0.25,
      ease: "none",
    },
    "startEnter"
  );

  tl.to(
    next,
    {
      rotation: 0,
      duration: 0.48,
      ease: "power1.out",
    },
    "startEnter"
  );

  tl.add("pageReady", "startEnter+=0.7");
  tl.call(resetPage, [next], "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}

// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter((data) => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
});

barba.hooks.enter((data) => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter((data) => {
  // Run page functions
  initAfterEnterFunctions(data.next.container, data);

  // Settle
  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: true, // Set to 'false' in production
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      // First load
      async once(data) {
        initOnceFunctions();

        return runPageOnceAnimation(data.next.container);
      },

      // Current page leaves
      async leave(data) {
        return runPageLeaveAnimation(
          data.current.container,
          data.next.container
        );
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      },
    },
  ],
});

// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light",
  },
  dark: {
    nav: "light",
    transition: "dark",
  },
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector("[data-theme-transition]");
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector("[data-theme-nav]");
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return; // already created
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement("template");
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll("[data-barba-update]");
  var currentNodes = document.querySelectorAll("nav [data-barba-update]");

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    // Aria-current sync
    var newStatus = next.getAttribute("aria-current");
    if (newStatus !== null) {
      curr.setAttribute("aria-current", newStatus);
    } else {
      curr.removeAttribute("aria-current");
    }

    // Class list sync
    var newClassList = next.getAttribute("class") || "";
    curr.setAttribute("class", newClassList);
  });
}

// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------

function resetWebflow(data) {
  if (!window.Webflow) return;
  if (!data?.next?.html) return;

  const parser = new DOMParser();
  const nextDoc = parser.parseFromString(data.next.html, "text/html");

  const nextPageId = nextDoc.documentElement.getAttribute("data-wf-page");
  const nextSiteId = nextDoc.documentElement.getAttribute("data-wf-site");

  if (nextPageId) {
    document.documentElement.setAttribute("data-wf-page", nextPageId);
  }

  if (nextSiteId) {
    document.documentElement.setAttribute("data-wf-site", nextSiteId);
  }

  window.Webflow.destroy();
  window.Webflow.ready();

  try {
    window.Webflow.require("ix2")?.init();
  } catch (e) {
    console.warn("Webflow ix2 init failed:", e);
  }

  try {
    if (nextSiteId) {
      window.Webflow.require("commerce")?.init({
        siteId: nextSiteId,
        apiUrl: "https://render.webflow.com",
      });
    }
  } catch (e) {
    console.warn("Webflow commerce init failed:", e);
  }
}

function initImageContentParallax() {
  if (!hasScrollTrigger) return;

  const wraps = nextPage.querySelectorAll(".image-content-parralax");

  wraps.forEach((wrap) => {
    const image = wrap.querySelector(".image-content");
    if (!image) return;
    if (image.dataset.parallaxInitialized === "true") return;

    image.dataset.parallaxInitialized = "true";

    gsap.to(image, {
      yPercent: 5,
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });
  });
}

function initHeadingMarquee(scope = nextPage, immediate = false) {
  const wraps = scope.querySelectorAll("[heading-move-wrap]");

  wraps.forEach((wrap) => {
    const track = wrap.querySelector("[heading-move]");
    if (!track) return;

    if (track.dataset.marqueeInitialized === "true") return;
    track.dataset.marqueeInitialized = "true";

    track.innerHTML += track.innerHTML;

    gsap.set(wrap, { overflow: "hidden" });
    gsap.set(track, {
      yPercent: 100,
      xPercent: 0,
      willChange: "transform",
    });

    const tl = gsap.timeline({ paused: !immediate });

    tl.to(
      track,
      {
        yPercent: 0,
        duration: 1,
        ease: "power3.out",
      },
      0
    );

    tl.to(
      track,
      {
        xPercent: -50,
        duration: 40,
        ease: "none",
        repeat: -1,
      },
      0
    );

    if (!immediate) {
      ScrollTrigger.create({
        trigger: wrap,
        start: "top 85%",
        once: true,
        onEnter: () => tl.play(),
      });
    }
  });
}

function initInsideViewsInfinite(scope = nextPage) {
  const sections = scope.querySelectorAll("[data-insideviews]");

  sections.forEach((section) => {
    const viewport = section.querySelector(".insideviews-viewport");
    const track = section.querySelector(".insideviews-track");
    const firstSet = section.querySelector(".insideviews-set");

    if (!viewport || !track || !firstSet) return;
    if (section.dataset.insideviewsInitialized === "true") return;
    section.dataset.insideviewsInitialized = "true";

    let currentX = 0;
    let targetX = 0;
    let velocity = 0;
    let isPointerInside = false;

    const getLoopWidth = () => firstSet.offsetWidth;

    const updateImages = () => {
      const viewportRect = viewport.getBoundingClientRect();
      const items = section.querySelectorAll(".insideviews-item");
      const edgeZone = viewportRect.width * 0.18;

      items.forEach((item) => {
        const rect = item.getBoundingClientRect();

        let targetHeight = 50; // normal
        const minHeight = 20; // an den Seiten

        if (rect.left < viewportRect.left + edgeZone) {
          const progress = gsap.utils.clamp(
            0,
            1,
            (rect.right - viewportRect.left) / edgeZone
          );

          targetHeight = gsap.utils.mapRange(0, 1, minHeight, 50, progress);
        }

        if (rect.right > viewportRect.right - edgeZone) {
          const progress = gsap.utils.clamp(
            0,
            1,
            (viewportRect.right - rect.left) / edgeZone
          );

          targetHeight = Math.min(
            targetHeight,
            gsap.utils.mapRange(0, 1, minHeight, 50, progress)
          );
        }

        gsap.set(item, {
          height: `${targetHeight}vh`,
        });
      });
    };

    const onWheel = (e) => {
      if (!isPointerInside) return;
      e.preventDefault();

      velocity += e.deltaY * 1.1;
    };

    const tick = () => {
      velocity *= 0.95;
      targetX -= velocity * 0.04;
      currentX += (targetX - currentX) * 0.14;

      const loopWidth = getLoopWidth();
      const wrappedX = gsap.utils.wrap(-loopWidth, 0, currentX);

      gsap.set(track, { x: wrappedX });
      updateImages();
    };

    viewport.addEventListener("mouseenter", () => {
      isPointerInside = true;
    });

    viewport.addEventListener("mouseleave", () => {
      isPointerInside = false;
    });

    viewport.addEventListener("wheel", onWheel, { passive: false });

    gsap.ticker.add(tick);

    const onResize = () => {
      updateImages();
    };

    window.addEventListener("resize", onResize);

    section._insideviewsDestroy = () => {
      viewport.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
    };

    updateImages();
  });
}

function initHeadingMetaAnimation(scope = nextPage) {
  if (!hasScrollTrigger) return;

  function getTriggerElement(el) {
    return el.parentElement || el;
  }

  function getStartAt(...elements) {
    return elements.some((el) => el?.hasAttribute("delay")) ? 0.2 : 0;
  }

  function setupSplitText(el, type = "heading") {
    const split = new SplitText(el, { type: "words, chars" });

    gsap.set(split.words, {
      display: "inline-block",
      whiteSpace: "nowrap",
    });

    gsap.set(split.chars, {
      display: "inline-block",
      opacity: 0,
      x: "0.75rem",
      willChange: "opacity, transform",
    });

    if (type === "heading") {
      el.dataset.headingAnimationInitialized = "true";
    }

    if (type === "meta") {
      el.dataset.metaAnimationInitialized = "true";
    }

    return split;
  }

  function setupDivider(el) {
    gsap.set(el, {
      scaleX: 0,
      x: "3rem",
      transformOrigin: "left center",
      willChange: "transform",
    });

    el.dataset.dividerAnimationInitialized = "true";
  }

  // 1) Heading-Animationen
  const headings = scope.querySelectorAll("[heading-animation]");

  headings.forEach((heading) => {
    if (heading.dataset.headingAnimationInitialized === "true") return;

    const container = heading.parentElement;
    const meta =
      container?.querySelector("[meta-animation]") &&
      container.querySelector("[meta-animation]").dataset
        .metaAnimationInitialized !== "true"
        ? container.querySelector("[meta-animation]")
        : null;

    const divider =
      container?.querySelector("[divider-animation]") &&
      container.querySelector("[divider-animation]").dataset
        .dividerAnimationInitialized !== "true"
        ? container.querySelector("[divider-animation]")
        : null;

    const startAt = getStartAt(heading, meta, divider);

    const headingSplit = setupSplitText(heading, "heading");
    const metaSplit = meta ? setupSplitText(meta, "meta") : null;

    if (divider) {
      setupDivider(divider);
    }

    const tl = gsap.timeline({ paused: true });

    tl.to(
      headingSplit.chars,
      {
        opacity: 1,
        x: "0rem",
        duration: 0.4,
        stagger: 0.05,
        ease: "sine.out",
      },
      startAt
    );

    if (metaSplit) {
      tl.to(
        metaSplit.chars,
        {
          opacity: 1,
          x: "0rem",
          duration: 0.4,
          stagger: 0.06,
          ease: "sine.out",
        },
        startAt
      );
    }

    if (divider) {
      tl.to(
        divider,
        {
          scaleX: 1,
          x: "0rem",
          duration: 0.8,
          ease: "power2.out",
        },
        startAt
      );
    }

    ScrollTrigger.create({
      trigger: getTriggerElement(heading),
      start: "top 75%",
      once: true,
      onEnter: () => tl.play(),
    });
  });

  // 2) Eigenständige Meta-Animationen
  const metas = scope.querySelectorAll("[meta-animation]");

  metas.forEach((meta) => {
    if (meta.dataset.metaAnimationInitialized === "true") return;

    const startAt = getStartAt(meta);
    const metaSplit = setupSplitText(meta, "meta");

    const tl = gsap.timeline({ paused: true });

    tl.to(
      metaSplit.chars,
      {
        opacity: 1,
        x: "0rem",
        duration: 0.4,
        stagger: 0.06,
        ease: "sine.out",
      },
      startAt
    );

    ScrollTrigger.create({
      trigger: getTriggerElement(meta),
      start: "top 75%",
      once: true,
      onEnter: () => tl.play(),
    });
  });

  // 3) Eigenständige Divider-Animationen
  const dividers = scope.querySelectorAll("[divider-animation]");

  dividers.forEach((divider) => {
    if (divider.dataset.dividerAnimationInitialized === "true") return;

    const startAt = getStartAt(divider);

    setupDivider(divider);

    const tl = gsap.timeline({ paused: true });

    tl.to(
      divider,
      {
        scaleX: 1,
        x: "0rem",
        duration: 0.8,
        ease: "power2.out",
      },
      startAt
    );

    ScrollTrigger.create({
      trigger: getTriggerElement(divider),
      start: "top 75%",
      once: true,
      onEnter: () => tl.play(),
    });
  });
}

function initHeroHeadingMetaAnimation(scope = nextPage, immediate = false) {
  const wraps = scope.querySelectorAll("[hero-animation-wrap]");

  wraps.forEach((wrap) => {
    if (wrap.dataset.heroAnimationInitialized === "true") return;
    wrap.dataset.heroAnimationInitialized = "true";

    const headings = wrap.querySelectorAll("[heading-hero-animation]");
    const meta = wrap.querySelector("[meta-hero-animation]") || null;
    const dividers = wrap.querySelectorAll("[divider-hero-animation]");

    if (!headings.length) return;

    const hasDelay =
      wrap.hasAttribute("delay") ||
      [...headings].some((heading) => heading.hasAttribute("delay")) ||
      meta?.hasAttribute("delay") ||
      [...dividers].some((divider) => divider.hasAttribute("delay"));

    const startAt = hasDelay ? 0.2 : 0;

    gsap.set(headings, { opacity: 1 });

    if (meta) {
      gsap.set(meta, { opacity: 1 });
    }

    const headingSplits = [];

    headings.forEach((heading) => {
      const split = new SplitText(heading, {
        type: "words, chars",
        wordsClass: "split-word",
        charsClass: "split-char-heading",
      });

      gsap.set(split.words, {
        display: "inline-block",
        whiteSpace: "nowrap",
      });

      gsap.set(split.chars, {
        display: "inline-block",
        opacity: 0,
        x: "0.75rem",
        willChange: "opacity, transform",
      });

      headingSplits.push(split);
    });

    const metaSplit = meta
      ? new SplitText(meta, {
          type: "words, chars",
          wordsClass: "split-word",
          charsClass: "split-char-meta",
        })
      : null;

    if (metaSplit) {
      gsap.set(metaSplit.words, {
        display: "inline-block",
        whiteSpace: "nowrap",
      });

      gsap.set(metaSplit.chars, {
        display: "inline-block",
        opacity: 0,
        x: "0.3rem",
        willChange: "opacity, transform",
      });
    }

    if (dividers.length) {
      gsap.set(dividers, {
        width: "0%",
        x: "3rem",
        willChange: "width, transform",
      });
    }

    const tl = gsap.timeline({ paused: true });

    headingSplits.forEach((split) => {
      tl.to(
        split.chars,
        {
          opacity: 1,
          x: "0rem",
          duration: 0.6,
          stagger: 0.08,
          ease: "sine.out",
        },
        startAt
      );
    });

    if (metaSplit) {
      tl.to(
        metaSplit.chars,
        {
          opacity: 1,
          x: "0rem",
          duration: 0.12,
          stagger: 0.017,
          ease: "sine.out",
        },
        startAt
      );
    }

    if (dividers.length) {
      tl.to(
        dividers,
        {
          width: "100%",
          x: "0rem",
          duration: 0.6,
          ease: "power2.out",
        },
        startAt
      );
    }

    if (immediate) {
      tl.play(0);
    } else {
      requestAnimationFrame(() => tl.play(0));
    }
  });
}
