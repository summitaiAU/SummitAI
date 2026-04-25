const hero = document.querySelector("[data-scroll-hero]");
const traceSection = document.querySelector("[data-trace-section]");
const tracePanel = traceSection?.querySelector(".trace-panel") || null;
const traceStageRegion = traceSection?.querySelector(".trace-stage-region") || null;
const traceStageViewport = traceSection?.querySelector(".trace-stage-viewport") || null;
const traceStageList = traceSection?.querySelector(".trace-stage-list") || null;
const traceStages = traceSection ? Array.from(traceSection.querySelectorAll("[data-trace-stage]")) : [];
const traceLetters = traceSection ? Array.from(traceSection.querySelectorAll("[data-trace-letter]")) : [];
const logoMarquees = Array.from(document.querySelectorAll("[data-logo-marquee]"));
const heroContent = hero?.querySelector(".hero-content") || null;
const heroLogoCarousel = heroContent?.querySelector(".hero-logo-carousel") || null;
const siteLoader = document.querySelector("[data-site-loader]");
const root = document.documentElement;
const body = document.body;
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const hoverCapableQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

let heroFrame = 0;
let heroCarouselFrame = 0;
let logoMarqueeFrame = 0;
let traceFrame = 0;
let tracePinTrigger = null;
let updateTraceShader = null;
let traceShaderProgress = 0;
let lenisInstance = null;
let lenisTicker = null;
let loaderDismissed = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, progress) => start + (end - start) * progress;
const isMobileLayout = () => window.innerWidth <= 900;
const isPhoneLayout = () => window.innerWidth <= 560;
const shouldUseNativeScroll = () => reduceMotionQuery.matches || isMobileLayout() || !hoverCapableQuery.matches;

const dismissSiteLoader = () => {
  if (!siteLoader || !body || loaderDismissed) {
    return;
  }

  loaderDismissed = true;
  body.classList.remove("is-loading");

  siteLoader.addEventListener(
    "transitionend",
    () => {
      siteLoader.setAttribute("hidden", "");
    },
    { once: true },
  );
};

const scheduleSiteLoaderDismiss = () => {
  const delay = reduceMotionQuery.matches ? 0 : 320;

  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      dismissSiteLoader();
    });
  }, delay);
};

const destroySmoothScroll = () => {
  const { gsap } = window;

  if (gsap && lenisTicker) {
    gsap.ticker.remove(lenisTicker);
    lenisTicker = null;
  }

  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }

  window.ScrollTrigger?.refresh();
};

const initSmoothScroll = () => {
  if (lenisInstance || shouldUseNativeScroll()) {
    return;
  }

  const { gsap, ScrollTrigger, Lenis } = window;

  if (!gsap || !ScrollTrigger || !Lenis) {
    return;
  }

  lenisInstance = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.92,
    touchMultiplier: 1,
  });

  lenisInstance.on("scroll", ScrollTrigger.update);

  lenisTicker = (time) => {
    lenisInstance?.raf(time * 1000);
  };

  gsap.ticker.add(lenisTicker);
  gsap.ticker.lagSmoothing(0);
};

const syncSmoothScrollPreference = () => {
  if (shouldUseNativeScroll()) {
    destroySmoothScroll();
    return;
  }

  initSmoothScroll();
};

syncSmoothScrollPreference();
window.addEventListener("resize", syncSmoothScrollPreference);
window.addEventListener("load", () => {
  lenisInstance?.resize();
  window.ScrollTrigger?.refresh();
  scheduleSiteLoaderDismiss();
});

if (reduceMotionQuery.addEventListener) {
  reduceMotionQuery.addEventListener("change", syncSmoothScrollPreference);
} else {
  reduceMotionQuery.addListener(syncSmoothScrollPreference);
}

if (hoverCapableQuery.addEventListener) {
  hoverCapableQuery.addEventListener("change", syncSmoothScrollPreference);
} else {
  hoverCapableQuery.addListener(syncSmoothScrollPreference);
}

const getHeroSettings = () => {
  const width = window.innerWidth;

  if (isPhoneLayout()) {
    return {
      scaleX: 0.978,
      scaleY: 0.996,
      radiusStart: 22,
      radiusEnd: 30,
      rangeFactor: 0.2,
    };
  }

  if (isMobileLayout()) {
    return {
      scaleX: 0.968,
      scaleY: 0.994,
      radiusStart: 26,
      radiusEnd: 36,
      rangeFactor: 0.23,
    };
  }

  return {
    scaleX: 0.954,
    scaleY: 0.992,
    radiusStart: 28,
    radiusEnd: 44,
    rangeFactor: 0.26,
  };
};

const applyStaticHero = () => {
  const settings = getHeroSettings();

  root.style.setProperty("--hero-scale-x", "1");
  root.style.setProperty("--hero-scale-y", "1");
  root.style.setProperty("--hero-radius", `${settings.radiusStart}px`);
};

const updateHeroFrame = () => {
  heroFrame = 0;

  if (!hero || reduceMotionQuery.matches || isMobileLayout()) {
    applyStaticHero();
    return;
  }

  const settings = getHeroSettings();
  const heroRange = Math.max(120, hero.offsetHeight * settings.rangeFactor);
  const rawProgress = clamp(window.scrollY / heroRange, 0, 1);
  const progress = 1 - Math.pow(1 - rawProgress, 2);
  const scaleX = lerp(1, settings.scaleX, progress);
  const scaleY = lerp(1, settings.scaleY, progress);
  const radius = lerp(settings.radiusStart, settings.radiusEnd, progress);

  root.style.setProperty("--hero-scale-x", scaleX.toFixed(4));
  root.style.setProperty("--hero-scale-y", scaleY.toFixed(4));
  root.style.setProperty("--hero-radius", `${radius.toFixed(2)}px`);
};

const requestHeroFrame = () => {
  if (heroFrame) {
    return;
  }

  heroFrame = window.requestAnimationFrame(updateHeroFrame);
};

if (hero) {
  updateHeroFrame();
  window.addEventListener("scroll", requestHeroFrame, { passive: true });
  window.addEventListener("resize", requestHeroFrame);

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener("change", requestHeroFrame);
  } else {
    reduceMotionQuery.addListener(requestHeroFrame);
  }
}

const updateHeroCarouselLayout = () => {
  heroCarouselFrame = 0;

  if (!heroContent || !heroLogoCarousel) {
    return;
  }

  const carouselStyles = getComputedStyle(heroLogoCarousel);
  const bottomOffset = parseFloat(carouselStyles.bottom) || 0;
  const carouselHeight = heroLogoCarousel.getBoundingClientRect().height || 0;
  const clearance = Math.ceil(bottomOffset + carouselHeight + 20);

  heroContent.style.setProperty("--hero-carousel-clearance", `${clearance}px`);
};

const requestHeroCarouselFrame = () => {
  if (heroCarouselFrame) {
    return;
  }

  heroCarouselFrame = window.requestAnimationFrame(updateHeroCarouselLayout);
};

if (heroContent && heroLogoCarousel) {
  requestHeroCarouselFrame();
  window.addEventListener("load", requestHeroCarouselFrame);
  window.addEventListener("resize", requestHeroCarouselFrame);

  if (window.ResizeObserver) {
    const heroCarouselObserver = new ResizeObserver(requestHeroCarouselFrame);

    if (heroLogoCarousel) {
      heroCarouselObserver.observe(heroLogoCarousel);
    }
  }

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener("change", requestHeroCarouselFrame);
  } else {
    reduceMotionQuery.addListener(requestHeroCarouselFrame);
  }
}

const buildLogoMarquees = () => {
  logoMarquees.forEach((marquee) => {
    const track = marquee.querySelector(".logo-marquee-track");
    const sourceGroup = track?.querySelector(".logo-marquee-group");

    if (!track || !sourceGroup || track.dataset.ready === "true") {
      return;
    }

    // Clone the source row once so the track can slide by one full row with no visible reset.
    const clone = sourceGroup.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.append(clone);
    track.dataset.ready = "true";
  });
};

const updateLogoMarquees = () => {
  logoMarqueeFrame = 0;

  logoMarquees.forEach((marquee) => {
    const carousel = marquee.closest(".hero-logo-carousel");
    const track = marquee.querySelector(".logo-marquee-track");
    const sourceGroup = track?.querySelector(".logo-marquee-group");

    if (!carousel || !track || !sourceGroup) {
      return;
    }

    const styles = getComputedStyle(carousel);
    const pixelsPerSecond = parseFloat(styles.getPropertyValue("--logo-scroll-speed")) || 34;
    const loopWidth = sourceGroup.getBoundingClientRect().width;

    if (!loopWidth || pixelsPerSecond <= 0) {
      return;
    }

    marquee.style.setProperty("--logo-scroll-duration", `${(loopWidth / pixelsPerSecond).toFixed(2)}s`);
  });

  requestHeroCarouselFrame();
};

const requestLogoMarqueeFrame = () => {
  if (logoMarqueeFrame) {
    return;
  }

  logoMarqueeFrame = window.requestAnimationFrame(updateLogoMarquees);
};

if (logoMarquees.length) {
  buildLogoMarquees();
  requestLogoMarqueeFrame();
  window.addEventListener("load", requestLogoMarqueeFrame);
  window.addEventListener("resize", requestLogoMarqueeFrame);

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener("change", requestLogoMarqueeFrame);
  } else {
    reduceMotionQuery.addListener(requestLogoMarqueeFrame);
  }
}

const getTraceSettings = () => {
  const width = window.innerWidth;

  if (width <= 560) {
    return {
      scaleXStart: 0.982,
      scaleYStart: 0.997,
      radiusStart: 24,
      radiusEnd: 18,
      startLine: 0.84,
    };
  }

  if (width <= 900) {
    return {
      scaleXStart: 0.968,
      scaleYStart: 0.994,
      radiusStart: 30,
      radiusEnd: 20,
      startLine: 0.8,
    };
  }

  return {
    scaleXStart: 0.948,
    scaleYStart: 0.992,
    radiusStart: 34,
    radiusEnd: 20,
    startLine: 0.76,
  };
};

const isTraceMobileLayout = () => isPhoneLayout();
const isTracePinnedLayout = () => !isPhoneLayout();

const applyTraceFrameState = (entryProgress = 1, exitProgress = 0) => {
  const traceSettings = getTraceSettings();
  const heroSettings = getHeroSettings();
  const clampedEntry = clamp(entryProgress, 0, 1);
  const clampedExit = clamp(exitProgress, 0, 1);
  const baseScaleX = lerp(traceSettings.scaleXStart, 1, clampedEntry);
  const baseScaleY = lerp(traceSettings.scaleYStart, 1, clampedEntry);
  const baseRadius = lerp(traceSettings.radiusStart, traceSettings.radiusEnd, clampedEntry);
  const scaleX = lerp(baseScaleX, heroSettings.scaleX, clampedExit);
  const scaleY = lerp(baseScaleY, heroSettings.scaleY, clampedExit);
  const radius = lerp(baseRadius, heroSettings.radiusEnd, clampedExit);

  root.style.setProperty("--trace-scale-x", scaleX.toFixed(4));
  root.style.setProperty("--trace-scale-y", scaleY.toFixed(4));
  root.style.setProperty("--trace-radius", `${radius.toFixed(2)}px`);
};

const applyStaticTrace = () => {
  const settings = getTraceSettings();

  root.style.setProperty("--trace-scale-x", "1");
  root.style.setProperty("--trace-scale-y", "1");
  root.style.setProperty("--trace-radius", `${settings.radiusEnd}px`);
};

const updateTraceFrame = () => {
  traceFrame = 0;

  if (!traceSection || !tracePanel) {
    applyStaticTrace();
    return;
  }

  if (reduceMotionQuery.matches) {
    applyStaticTrace();

    if (typeof updateTraceShader === "function") {
      updateTraceShader();
    }

    return;
  }

  const settings = getTraceSettings();
  const panelRect = tracePanel.getBoundingClientRect();
  const navHeight = parseFloat(getComputedStyle(root).getPropertyValue("--nav-height")) || 0;
  const startLinePx = window.innerHeight * settings.startLine;
  const endLinePx = navHeight;
  const pinProgress = tracePinTrigger?.progress || 0;

  if (isTracePinnedLayout() && pinProgress > 0) {
    if (pinProgress >= 1) {
      applyTraceFrameState(1, 1);
    }

    if (typeof updateTraceShader === "function") {
      updateTraceShader();
    }

    return;
  }

  const rawProgress = clamp((startLinePx - panelRect.top) / Math.max(startLinePx - endLinePx, 1), 0, 1);
  const progress = 1 - Math.pow(1 - rawProgress, 2);
  applyTraceFrameState(progress, 0);

  if (typeof updateTraceShader === "function") {
    updateTraceShader();
  }
};

const requestTraceFrame = () => {
  if (traceFrame) {
    return;
  }

  traceFrame = window.requestAnimationFrame(updateTraceFrame);
};

const setTraceMethodState = (progress, staticMode = false) => {
  if (!traceSection || !traceStages.length) {
    return;
  }

  const normalizedProgress = clamp(progress, 0, 1);
  traceSection.classList.toggle("trace-section--static", staticMode);

  if (staticMode) {
    traceSection.style.setProperty("--trace-progress", "1");
    traceSection.style.setProperty("--trace-focus-y", "42%");
    traceSection.style.setProperty("--trace-focus-opacity", "0.04");
    traceSection.style.setProperty("--trace-stage-shift", "0px");

    traceStages.forEach((stage) => {
      stage.style.setProperty("--trace-stage-progress", "1");
      stage.style.setProperty("--trace-doctrine-progress", "1");
      stage.style.setProperty("--trace-detail-progress", "1");
      stage.classList.remove("is-active");
    });

    traceLetters.forEach((letter) => {
      letter.classList.toggle("is-active", Number(letter.dataset.traceLetter) === 0);
    });

    return;
  }

  const stageCount = traceStages.length;
  const activeIndex = clamp(Math.round(normalizedProgress * (stageCount - 1)), 0, stageCount - 1);
  traceSection.style.setProperty("--trace-progress", normalizedProgress.toFixed(4));

  traceStages.forEach((stage, index) => {
    const center = stageCount === 1 ? 0.5 : index / (stageCount - 1);
    const local = clamp(1 - Math.abs(normalizedProgress - center) / 0.28, 0, 1);
    const doctrine = clamp(local * 1.12, 0, 1);
    const detail = clamp((local - 0.16) / 0.84, 0, 1);

    stage.style.setProperty("--trace-stage-progress", local.toFixed(3));
    stage.style.setProperty("--trace-doctrine-progress", doctrine.toFixed(3));
    stage.style.setProperty("--trace-detail-progress", detail.toFixed(3));
    stage.classList.toggle("is-active", index === activeIndex);
  });

  traceLetters.forEach((letter, index) => {
    letter.classList.toggle("is-active", index === activeIndex);
  });

  if (traceStageViewport && traceStageList && traceStages.length > 1) {
    const viewportHeight = traceStageViewport.clientHeight;
    const listHeight = traceStageList.scrollHeight;
    const shiftTolerance = Math.max(56, viewportHeight * 0.08);

    if (listHeight <= viewportHeight + shiftTolerance) {
      traceSection.style.setProperty("--trace-stage-shift", "0px");
    } else {
      const centers = traceStages.map((stage) => stage.offsetTop + stage.offsetHeight * 0.5);
      const stageFloat = normalizedProgress * (stageCount - 1);
      const lowerIndex = Math.floor(stageFloat);
      const upperIndex = Math.min(Math.ceil(stageFloat), stageCount - 1);
      const mix = stageFloat - lowerIndex;
      const centerPosition = lerp(centers[lowerIndex], centers[upperIndex], mix);
      const targetCenter = viewportHeight * 0.34;
      const minShift = Math.min(0, viewportHeight - listHeight);
      const shift = clamp(targetCenter - centerPosition, minShift, 0);

      traceSection.style.setProperty("--trace-stage-shift", `${shift.toFixed(2)}px`);
    }
  }

  if (traceStageRegion) {
    const activeStage = traceStages[activeIndex];
    const regionRect = traceStageRegion.getBoundingClientRect();
    const stageRect = activeStage.getBoundingClientRect();
    const stageCenter = stageRect.top + stageRect.height * 0.5 - regionRect.top;
    const activeCenter = stageCount === 1 ? 0.5 : activeIndex / (stageCount - 1);
    const activeProgress = clamp(1 - Math.abs(normalizedProgress - activeCenter) / 0.28, 0, 1);
    const focusY = clamp((stageCenter / Math.max(regionRect.height, 1)) * 100, 14, 88);
    const focusOpacity = lerp(0.045, 0.1, activeProgress);

    traceSection.style.setProperty("--trace-focus-y", `${focusY.toFixed(2)}%`);
    traceSection.style.setProperty("--trace-focus-opacity", focusOpacity.toFixed(3));
  }
};

if (traceSection) {
  updateTraceFrame();
  window.addEventListener("scroll", requestTraceFrame, { passive: true });
  window.addEventListener("resize", requestTraceFrame);

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener("change", requestTraceFrame);
  } else {
    reduceMotionQuery.addListener(requestTraceFrame);
  }
}

const initTracePinSequence = () => {
  const { gsap, ScrollTrigger } = window;

  if (!traceSection || !tracePanel || !traceStages.length) {
    return;
  }

  if (!gsap || !ScrollTrigger) {
    setTraceMethodState(0, true);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const refreshTraceSequence = () => {
    if (tracePinTrigger) {
      tracePinTrigger.kill();
      tracePinTrigger = null;
    }

    if (isTraceMobileLayout() || reduceMotionQuery.matches) {
      traceShaderProgress = 0.2;
      setTraceMethodState(0, true);

      if (typeof updateTraceShader === "function") {
        updateTraceShader();
      }

      return;
    }

    traceSection.classList.remove("trace-section--static");

    // Tweak here: trigger point for when the pinned TRACE chamber takes over.
    const getStart = () => {
      const navHeight = parseFloat(getComputedStyle(root).getPropertyValue("--nav-height")) || 0;
      return `top top+=${navHeight}`;
    };

    const sequenceCutoff = 0.82;

    tracePinTrigger = ScrollTrigger.create({
      trigger: traceSection,
      pin: tracePanel,
      pinSpacing: false,
      start: getStart,
      end: () => "bottom bottom",
      // Tweak here: scrub smoothness. Lower is tighter to scroll, higher is softer.
      scrub: 0.72,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const sequenceProgress = clamp(self.progress / sequenceCutoff, 0, 1);
        const rawExitProgress = clamp((self.progress - sequenceCutoff) / (1 - sequenceCutoff), 0, 1);
        const exitProgress = 1 - Math.pow(1 - rawExitProgress, 2);

        traceShaderProgress = sequenceProgress;
        setTraceMethodState(sequenceProgress);
        applyTraceFrameState(1, exitProgress);

        if (typeof updateTraceShader === "function") {
          updateTraceShader();
        }
      },
      onRefresh: (self) => {
        const sequenceProgress = clamp(self.progress / sequenceCutoff, 0, 1);
        const rawExitProgress = clamp((self.progress - sequenceCutoff) / (1 - sequenceCutoff), 0, 1);
        const exitProgress = 1 - Math.pow(1 - rawExitProgress, 2);

        traceShaderProgress = sequenceProgress;
        setTraceMethodState(sequenceProgress);
        applyTraceFrameState(1, exitProgress);
      },
    });

    setTraceMethodState(0);
    applyTraceFrameState(1, 0);
  };

  let resizeToken = 0;
  const requestTraceRefresh = () => {
    if (resizeToken) {
      window.cancelAnimationFrame(resizeToken);
    }

    resizeToken = window.requestAnimationFrame(() => {
      resizeToken = 0;
      refreshTraceSequence();
      ScrollTrigger.refresh();
    });
  };

  refreshTraceSequence();
  window.addEventListener("resize", requestTraceRefresh);

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener("change", requestTraceRefresh);
  } else {
    reduceMotionQuery.addListener(requestTraceRefresh);
  }
};

const initScrollHeadingGlide = () => {
  const { gsap, ScrollTrigger } = window;

  if (!gsap || !ScrollTrigger || reduceMotionQuery.matches) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // A single eased tween keeps the motion clean, smooth, and editorial.
  const addSmoothGlide = (timeline, element, position = 0) => {
    timeline.to(
      element,
      {
        x: 0,
        autoAlpha: 1,
        duration: 0.72,
        ease: "power3.out",
      },
      position
    );
  };

  gsap.utils.toArray("[data-scroll-heading-group]").forEach((group) => {
    const heading = group.querySelector(".scroll-heading");
    const subheading = group.querySelector(".scroll-subheading");

    if (!heading) {
      return;
    }

    const desktopDistance = Number(group.dataset.scrollDistance || 132);
    const desktopSubDistance = Number(group.dataset.scrollSubDistance || 156);
    const isMobile = isPhoneLayout();
    const isTablet = isMobileLayout();
    const headingDistance = isMobile ? desktopDistance * 0.62 : isTablet ? desktopDistance * 0.78 : desktopDistance;
    const subheadingDistance = isMobile ? desktopSubDistance * 0.62 : isTablet ? desktopSubDistance * 0.78 : desktopSubDistance;
    const triggerStart = group.dataset.scrollStart || "top 82%";

    gsap.set(heading, { x: headingDistance, autoAlpha: 0.01 });

    if (subheading) {
      gsap.set(subheading, { x: subheadingDistance, autoAlpha: 0.01 });
    }

    const timeline = gsap.timeline({ paused: true });
    addSmoothGlide(timeline, heading, 0);

    if (subheading) {
      // Slight offset makes the copy feel like it follows the heading in.
      addSmoothGlide(timeline, subheading, 0.14);
    }

    ScrollTrigger.create({
      trigger: group,
      start: triggerStart,
      toggleActions: "play none none reverse",
      animation: timeline,
      invalidateOnRefresh: true,
    });
  });
};

initScrollHeadingGlide();

const initCaseStudyStatCounters = () => {
  const cards = Array.from(document.querySelectorAll(".case-study-card:not(.case-study-card--hidden)"));

  if (!cards.length) {
    return;
  }

  const counterStates = new WeakMap();
  const touchRevealThreshold = 0.35;

  const getCounterState = (card) => {
    const existingState = counterStates.get(card);

    if (existingState) {
      return existingState;
    }

    const nextState = { frame: 0, revealedOnTouch: false };
    counterStates.set(card, nextState);
    return nextState;
  };

  const isCardExpanded = (card) => card.classList.contains("is-active") || card.matches(":hover");

  const formatCounterValue = (counter, value) => {
    const decimals = Number(counter.dataset.decimals || 0);
    const prefix = counter.dataset.prefix || "";
    const suffix = counter.dataset.suffix || "";
    const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

    counter.textContent = `${prefix}${formatted}${suffix}`;
  };

  const setCardCounters = (card, progress) => {
    card.querySelectorAll(".case-study-stat-value").forEach((counter) => {
      const target = Number(counter.dataset.value || 0);
      formatCounterValue(counter, target * progress);
    });
  };

  const stopCardCounterAnimation = (card) => {
    const state = getCounterState(card);

    if (state.frame) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    }
  };

  const resetCardCounters = (card) => {
    stopCardCounterAnimation(card);
    setCardCounters(card, 0);
  };

  const animateCardCounters = (card) => {
    stopCardCounterAnimation(card);

    if (reduceMotionQuery.matches) {
      setCardCounters(card, isCardExpanded(card) ? 1 : 0);
      return;
    }

    const state = getCounterState(card);
    const start = performance.now();
    const duration = 920;

    const step = (now) => {
      const rawProgress = clamp((now - start) / duration, 0, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);

      setCardCounters(card, easedProgress);

      if (rawProgress < 1 && isCardExpanded(card)) {
        state.frame = window.requestAnimationFrame(step);
        return;
      }

      state.frame = 0;
      setCardCounters(card, isCardExpanded(card) ? 1 : 0);
    };

    state.frame = window.requestAnimationFrame(step);
  };

  const revealTouchCard = (card, shouldAnimate = true) => {
    const state = getCounterState(card);

    card.classList.add("is-active");

    if (state.revealedOnTouch) {
      setCardCounters(card, 1);
      return;
    }

    state.revealedOnTouch = true;

    if (shouldAnimate && !reduceMotionQuery.matches) {
      animateCardCounters(card);
      return;
    }

    setCardCounters(card, 1);
  };

  cards.forEach((card) => {
    getCounterState(card);
    setCardCounters(card, 0);

    card.addEventListener("pointerenter", () => {
      if (!hoverCapableQuery.matches) {
        return;
      }

      animateCardCounters(card);
    });

    card.addEventListener("pointerleave", () => {
      if (!hoverCapableQuery.matches) {
        return;
      }

      resetCardCounters(card);
    });

    card.addEventListener("click", () => {
      if (hoverCapableQuery.matches) {
        return;
      }

      revealTouchCard(card, false);
    });
  });

  if (!hoverCapableQuery.matches) {
    if ("IntersectionObserver" in window) {
      const touchRevealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || entry.intersectionRatio < touchRevealThreshold) {
              return;
            }

            revealTouchCard(entry.target);
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: [touchRevealThreshold, 0.6],
        },
      );

      cards.forEach((card) => {
        touchRevealObserver.observe(card);
      });
    } else {
      cards.forEach((card) => {
        revealTouchCard(card, false);
      });
    }
  }

  const handleMotionPreferenceChange = () => {
    cards.forEach((card) => {
      const state = getCounterState(card);

      if (!hoverCapableQuery.matches && state.revealedOnTouch) {
        card.classList.add("is-active");
        setCardCounters(card, 1);
        return;
      }

      if (reduceMotionQuery.matches && isCardExpanded(card)) {
        setCardCounters(card, 1);
        return;
      }

      resetCardCounters(card);
    });
  };

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener("change", handleMotionPreferenceChange);
  } else {
    reduceMotionQuery.addListener(handleMotionPreferenceChange);
  }
};

initCaseStudyStatCounters();

const initContactForm = () => {
  const form = document.querySelector("[data-contact-form]");
  const status = form?.querySelector("[data-contact-status]") || null;

  if (!form) {
    return;
  }

  const defaultStatus = status?.textContent || "";
  const setStatus = (message, isSuccess = false) => {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle("is-success", isSuccess);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    setStatus("Demo send only. No enquiry was sent from this form.", true);
  });

  form.addEventListener("input", () => {
    if (!status || status.textContent === defaultStatus) {
      return;
    }

    setStatus(defaultStatus);
  });
};

initContactForm();

const initTraceHalftoneField = () => {
  const canvas = document.getElementById("trace-shader-background");

  if (!canvas) {
    return;
  }

  const SETTINGS = Object.freeze({
    dotSize: 2,
    dotSpacing: 6,
    bandAngle: -36,
    bandWidth: 0.46,
    bandBrightness: 0.68,
    falloffSoftness: 1.34,
    movementSpeed: 0.26,
    curvatureAmount: 0.16,
    backgroundBrightness: 0.04,
    overallContrast: 1.18,
    maxGrey: 0.92,
    targetFrameRate: 36,
    desktopDprCap: 1.5,
    mobileDprCap: 1.0,
    offscreenCellMargin: 2,
    paletteSteps: 56,
  });

  const BAYER_8 = [
     0, 48, 12, 60,  3, 51, 15, 63,
    32, 16, 44, 28, 35, 19, 47, 31,
     8, 56,  4, 52, 11, 59,  7, 55,
    40, 24, 36, 20, 43, 27, 39, 23,
     2, 50, 14, 62,  1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29,
    10, 58,  6, 54,  9, 57,  5, 53,
    42, 26, 38, 22, 41, 25, 37, 21,
  ];

  class TraceHalftoneField {
    constructor(canvasElement, settings, overrides = {}) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext("2d", { alpha: false, desynchronized: true });
      this.settings = { ...settings, ...overrides };
      this.cells = [];
      this.lastTime = 0;
      this.resizeObserver = null;
      this.boundResize = this.resize.bind(this);
      this.palette = this.buildPalette();
      this.resize();

      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(this.boundResize);
        this.resizeObserver.observe(this.canvas);
      }

      window.addEventListener("resize", this.boundResize, { passive: true });
    }

    buildPalette() {
      const palette = [];

      for (let i = 0; i < this.settings.paletteSteps; i += 1) {
        const grey = Math.round((i / (this.settings.paletteSteps - 1)) * 255);
        palette.push(`rgb(${grey}, ${grey}, ${grey})`);
      }

      return palette;
    }

    resize() {
      const width = Math.max(this.canvas.clientWidth || 1, 1);
      const height = Math.max(this.canvas.clientHeight || 1, 1);
      const isMobile = Math.min(window.innerWidth, window.innerHeight) < 768;
      const dprCap = isMobile ? this.settings.mobileDprCap : this.settings.desktopDprCap;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

      this.cssWidth = width;
      this.cssHeight = height;
      this.dpr = dpr;
      this.canvas.width = Math.max(1, Math.round(width * dpr));
      this.canvas.height = Math.max(1, Math.round(height * dpr));
      this.ctx.imageSmoothingEnabled = false;

      this.rebuildGrid();
      this.render(this.lastTime);
    }

    rebuildGrid() {
      const angle = (this.settings.bandAngle * Math.PI) / 180;
      const tangentX = Math.cos(angle);
      const tangentY = Math.sin(angle);
      const normalX = -tangentY;
      const normalY = tangentX;
      const warpX = 0.78;
      const warpY = -0.56;
      const dotPx = Math.max(1, Math.round(this.settings.dotSize * this.dpr));
      const gapPx = Math.max(1, Math.round(this.settings.dotSpacing * this.dpr));
      const pitchPx = dotPx + gapPx;
      const margin = this.settings.offscreenCellMargin;
      const usableCols = Math.ceil(this.canvas.width / pitchPx);
      const usableRows = Math.ceil(this.canvas.height / pitchPx);
      const cols = usableCols + margin * 2;
      const rows = usableRows + margin * 2;
      const offsetX = Math.floor((this.canvas.width - usableCols * pitchPx) * 0.5) - margin * pitchPx;
      const offsetY = Math.floor((this.canvas.height - usableRows * pitchPx) * 0.5) - margin * pitchPx;
      const aspect = this.canvas.width / Math.max(this.canvas.height, 1);

      this.dotPx = dotPx;
      this.pitchPx = pitchPx;
      this.baseFill = `rgb(${Math.round(this.settings.backgroundBrightness * 34)}, ${Math.round(this.settings.backgroundBrightness * 34)}, ${Math.round(this.settings.backgroundBrightness * 34)})`;
      this.cells = [];

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const x = offsetX + col * pitchPx;
          const y = offsetY + row * pitchPx;
          const centerX = (x + dotPx * 0.5) / this.canvas.width;
          const centerY = (y + dotPx * 0.5) / this.canvas.height;
          const nx = (centerX * 2 - 1) * aspect;
          const ny = centerY * 2 - 1;

          this.cells.push({
            x,
            y,
            along: nx * tangentX + ny * tangentY,
            across: nx * normalX + ny * normalY,
            warp: nx * warpX + ny * warpY,
            threshold: BAYER_8[(row & 7) * 8 + (col & 7)] / 63,
          });
        }
      }
    }

    sampleField(cell, phase) {
      // Tweak here: strip travel distance. Start value keeps it visible, end value clears top-left.
      const drift = lerp(0.7, -1.28, phase);

      const curve =
        this.settings.curvatureAmount *
        (
          Math.sin(cell.along * 1.24) * 0.52 +
          Math.sin(cell.along * 2.62 + 1.1) * 0.22 +
          Math.sin(cell.warp * 0.92) * 0.18
        );

      const width =
        this.settings.bandWidth *
        (1 + 0.16 * Math.sin(cell.along * 0.72 + 0.46));

      const distance = cell.across - drift - curve;
      const exponent = 1.05 + this.settings.falloffSoftness * 0.9;
      let band = Math.exp(-Math.pow(Math.abs(distance) / Math.max(width, 0.0001), exponent));

      const contourDetail =
        0.94 +
        0.06 *
        (
          0.5 +
          0.5 *
          Math.sin(
            cell.along * 3.64 -
            Math.sin(cell.across * 1.72) * 0.42
          )
        );

      band *= contourDetail;

      const interference =
        Math.sin(cell.warp * 5.6 - 1.2) * 0.018 +
        Math.sin(cell.along * 7.1 + cell.across * 1.4) * 0.014;

      let signal = this.settings.backgroundBrightness + band * this.settings.bandBrightness + interference;
      signal =
        this.settings.backgroundBrightness +
        (signal - this.settings.backgroundBrightness) * this.settings.overallContrast;

      return clamp(signal, 0, this.settings.maxGrey);
    }

    render(phase) {
      this.lastTime = phase;

      const ctx = this.ctx;
      const palette = this.palette;
      const paletteMax = palette.length - 1;
      const ambientFloor = this.settings.backgroundBrightness * 0.42;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = this.baseFill;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      let lastShade = "";

      for (let i = 0; i < this.cells.length; i += 1) {
        const cell = this.cells[i];
        const signal = this.sampleField(cell, phase);
        const baseDot = this.settings.backgroundBrightness * (0.62 + (1 - cell.threshold) * 0.14);
        const ditherLift = clamp((signal - cell.threshold * 0.82) / 0.28, 0, 1);
        const grey = clamp(baseDot + ditherLift * signal, ambientFloor, this.settings.maxGrey);
        const shade = palette[Math.round(grey * paletteMax)];

        if (shade !== lastShade) {
          ctx.fillStyle = shade;
          lastShade = shade;
        }

        ctx.fillRect(cell.x, cell.y, this.dotPx, this.dotPx);
      }
    }

    destroy() {
      window.removeEventListener("resize", this.boundResize);

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
    }
  }

  const field = new TraceHalftoneField(canvas, SETTINGS);

  updateTraceShader = () => {
    if (document.hidden) {
      return;
    }

    field.render(reduceMotionQuery.matches ? 0 : traceShaderProgress);
  };

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      requestTraceFrame();
    }
  });

  if (typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", requestTraceFrame);
  } else if (typeof reduceMotionQuery.addListener === "function") {
    reduceMotionQuery.addListener(requestTraceFrame);
  }

  requestTraceFrame();

  window.TraceHalftoneField = TraceHalftoneField;
  window.__traceField = field;
};

initTraceHalftoneField();
initTracePinSequence();

(() => {
  "use strict";

  const canvas = document.getElementById("shader-background");

  if (!canvas) {
    return;
  }

  const CONFIG = {
    colors: {
      blueDeep: "#3A68B8",
      blueRoyal: "#5470D6",
      violet: "#B85FF3",
      lavender: "#BE81C9",
      peach: "#EF9156",
      blush: "#F2C1DD",
    },
    animationSpeed: 0.72,
    mouseStrength: 1.05,
    mouseRadius: 0.45,
    relaxation: 0.075,
    damping: 0.86,
    grainAmount: 0.036,
    softness: 1.0,
    maxPixelRatio: 2,
  };

  const VERTEX_SHADER = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SHADER = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec2 u_mouse_velocity;
    uniform float u_mouse_active;
    uniform float u_mouse_strength;
    uniform float u_mouse_radius;
    uniform float u_softness;
    uniform float u_grain_amount;

    uniform vec3 u_blue_deep;
    uniform vec3 u_blue_royal;
    uniform vec3 u_violet;
    uniform vec3 u_lavender;
    uniform vec3 u_peach;
    uniform vec3 u_blush;

    varying vec2 v_uv;

    float saturate(float value) {
      return clamp(value, 0.0, 1.0);
    }

    float smoother(float value) {
      value = saturate(value);
      return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
    }

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float valueNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      float a = hash12(i);
      float b = hash12(i + vec2(1.0, 0.0));
      float c = hash12(i + vec2(0.0, 1.0));
      float d = hash12(i + vec2(1.0, 1.0));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float total = 0.0;
      float amplitude = 0.5;
      mat2 basis = mat2(1.58, 1.12, -1.12, 1.58);

      for (int i = 0; i < 5; i++) {
        total += valueNoise(p) * amplitude;
        p = basis * p + vec2(13.17, 7.31);
        amplitude *= 0.5;
      }

      return total;
    }

    float softEllipse(vec2 p, vec2 center, vec2 radius, float angle) {
      vec2 d = p - center;
      float s = sin(angle);
      float c = cos(angle);
      d = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
      d /= radius;
      return exp(-dot(d, d));
    }

    vec2 ambientWarp(vec2 uv, float t) {
      vec2 p = uv;

      float broadA = fbm(p * 1.08 + vec2(0.02 * t, -0.016 * t));
      float broadB = fbm(p * 1.22 + vec2(5.4 - 0.015 * t, 2.1 + 0.012 * t));
      vec2 drift = vec2(broadA - 0.5, broadB - 0.5);

      float veil = sin((p.y * 2.45 + fbm(p * 1.45 + t * 0.012) * 1.55 + t * 0.05) * 3.14159265);
      float sideFlow = sin(p.x * 3.65 - t * 0.045 + fbm(p * 1.9) * 1.2);

      p.x += (drift.x * 0.095 + veil * 0.019) * u_softness;
      p.y += (drift.y * 0.052 + sideFlow * 0.013) * u_softness;

      return p;
    }

    vec2 mouseWarp(vec2 p) {
      float aspect = u_resolution.x / max(u_resolution.y, 1.0);
      vec2 delta = p - u_mouse;
      vec2 metricDelta = delta * vec2(aspect, 1.0);
      float dist2 = dot(metricDelta, metricDelta);
      float radius = max(u_mouse_radius, 0.001);

      float broad = exp(-dist2 / (radius * radius));
      float close = exp(-dist2 / (radius * radius * 0.36));

      vec2 metricVelocity = u_mouse_velocity * vec2(aspect, 1.0);
      float velocityLength = max(length(metricVelocity), 0.00001);
      float speed = saturate(velocityLength * 25.0);
      vec2 dir = metricVelocity / velocityLength;
      vec2 perpUv = vec2(-dir.y / aspect, dir.x);
      float along = dot(metricDelta, dir);

      vec2 warp = vec2(0.0);

      warp -= u_mouse_velocity * broad * (1.05 + speed * 0.78);
      warp += perpUv * along * broad * 0.13;
      warp.x += (p.y - u_mouse.y) * broad * (0.094 + speed * 0.052);
      warp.y -= broad * (0.076 + speed * 0.056);
      warp.x -= delta.x * close * 0.050;

      return p + warp * u_mouse_strength * u_mouse_active;
    }

    vec3 composeColor(vec2 p, float t) {
      float contourNoise = fbm(vec2(p.y * 1.75 + t * 0.018, p.x * 0.65 - t * 0.012));
      float contour = (contourNoise - 0.5) * 0.07;
      float slowBend = sin(p.y * 3.15 + t * 0.075) * 0.037 + contour;

      float blueBoundary = 0.43 + slowBend + smoothstep(0.1, 0.95, p.y) * 0.035;
      float blueSide = 1.0 - smoothstep(blueBoundary, blueBoundary + 0.34 * u_softness, p.x);
      float bluePocket = softEllipse(p, vec2(0.02, 0.34), vec2(0.35, 0.76), -0.05);
      float blueTop = (1.0 - smoothstep(0.28, 0.88, p.x)) * smoothstep(0.30, 0.95, p.y);

      float peachCenter = 0.355 + p.y * 0.19 + sin(p.y * 4.4 + t * 0.06) * 0.025;
      peachCenter += (fbm(p * 1.15 + vec2(2.7, t * 0.018)) - 0.5) * 0.044;
      float peachWidth = mix(0.40, 0.16, smoother((p.y - 0.02) / 0.72));
      float peachColumn = exp(-pow((p.x - peachCenter) / peachWidth, 2.0));
      peachColumn *= 1.0 - smoothstep(0.13, 0.74, p.y);
      float peachBase = softEllipse(p, vec2(0.43, -0.08), vec2(0.45, 0.38), 0.0);
      float peachShoulder = softEllipse(p, vec2(0.57, 0.23), vec2(0.42, 0.23), 0.18);

      float violetTop = softEllipse(p, vec2(0.69, 0.90), vec2(0.56, 0.32), 0.05);
      float violetMid = softEllipse(p, vec2(0.57, 0.62), vec2(0.44, 0.39), -0.24);
      float violetWash = smoothstep(0.33, 0.94, p.y) * smoothstep(0.28, 0.78, p.x);

      float blushSide = smoothstep(0.34 + slowBend * 0.35, 0.84, p.x);
      float blushBody = softEllipse(p, vec2(0.83, 0.43), vec2(0.64, 0.62), 0.0);
      float blushLower = softEllipse(p, vec2(0.74, 0.12), vec2(0.60, 0.32), 0.0);

      float lavenderBridge = softEllipse(p, vec2(0.54, 0.50), vec2(0.54, 0.45), -0.10);
      float lavenderVeil = softEllipse(p, vec2(0.48, 0.74), vec2(0.44, 0.35), -0.25);

      vec3 blue = mix(u_blue_deep, u_blue_royal, smoother(p.y * 0.95 + p.x * 0.18));
      vec3 peach = u_peach;
      vec3 violet = mix(u_lavender, u_violet, smoother(violetTop + violetWash * 0.38));
      vec3 lavender = mix(u_lavender, u_blush, 0.23);
      vec3 blush = u_blush;

      float rightMass = smoother(smoothstep(0.25 + slowBend * 0.42, 0.96, p.x));
      float blueMass = saturate(blueSide * 0.88 + bluePocket * 0.34 + blueTop * 0.22);
      float peachMass = saturate(max(peachBase, peachColumn * 0.98) * 1.16 + peachShoulder * 0.30);
      peachMass *= smoothstep(0.06, 0.28, p.x);
      float violetMass = saturate(violetTop * 0.96 + violetMid * 0.28 + violetWash * 0.40);
      float lavenderMass = saturate(lavenderBridge * 0.44 + lavenderVeil * 0.32);
      float blushMass = saturate(blushSide * 0.72 + blushBody * 0.48 + blushLower * 0.20);

      vec3 color = mix(blue, blush, rightMass);

      color = mix(color, blue, blueMass * (1.0 - rightMass) * 0.24);
      color = mix(color, lavender, smoother(lavenderMass) * 0.32);
      color = mix(color, blush, smoother(blushMass) * rightMass * 0.16);
      color = mix(color, violet, smoother(violetMass) * 0.62);
      color = mix(color, peach, smoother(peachMass) * 0.82);

      float leftCobalt = (1.0 - smoothstep(0.03, 0.32, p.x)) * (0.76 + 0.24 * smoothstep(0.16, 0.92, p.y));
      color = mix(color, blue, leftCobalt * 0.42);

      float luminousMist = fbm(p * 1.65 + vec2(t * 0.01, -t * 0.008));
      color += (luminousMist - 0.5) * vec3(0.018, 0.012, 0.024);

      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(luma), color, 1.12);
      color = pow(max(color, vec3(0.0)), vec3(0.97));

      return color;
    }

    void main() {
      vec2 uv = v_uv;
      float t = u_time;

      vec2 p = ambientWarp(uv, t);
      p = mouseWarp(p);

      float postWarp = fbm(p * 1.35 + vec2(-t * 0.013, t * 0.01)) - 0.5;
      p.x += postWarp * 0.028 * u_softness;

      vec3 color = composeColor(p, t);

      float staticGrain = hash12(gl_FragCoord.xy);
      float softGrain = hash12(gl_FragCoord.xy * 0.73 + floor(t * 8.0) * 19.19);
      float grain = (staticGrain * 0.72 + softGrain * 0.28) - 0.5;
      color += grain * u_grain_amount;

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  const createFluidBackground = (targetCanvas, config) => {
    const gl = targetCanvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      document.documentElement.classList.add("webgl-fallback");
      return null;
    }

    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    const uniforms = getUniforms(gl, program, [
      "u_resolution",
      "u_time",
      "u_mouse",
      "u_mouse_velocity",
      "u_mouse_active",
      "u_mouse_strength",
      "u_mouse_radius",
      "u_softness",
      "u_grain_amount",
      "u_blue_deep",
      "u_blue_royal",
      "u_violet",
      "u_lavender",
      "u_peach",
      "u_blush",
    ]);

    const position = gl.getAttribLocation(program, "a_position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = {
      target: [0.48, 0.46],
      current: [0.48, 0.46],
      previous: [0.48, 0.46],
      velocity: [0, 0],
      active: 0,
      energy: 0,
      inside: false,
    };

    let startTime = performance.now();
    let previousTime = startTime;
    let rafId = 0;
    let needsRender = true;
    let destroyed = false;
    let resizeObserver = null;

    uploadStaticUniforms();
    resize();
    bindEvents();
    schedule();

    function uploadStaticUniforms() {
      gl.useProgram(program);
      gl.uniform3fv(uniforms.u_blue_deep, hexToRgb01(config.colors.blueDeep));
      gl.uniform3fv(uniforms.u_blue_royal, hexToRgb01(config.colors.blueRoyal));
      gl.uniform3fv(uniforms.u_violet, hexToRgb01(config.colors.violet));
      gl.uniform3fv(uniforms.u_lavender, hexToRgb01(config.colors.lavender));
      gl.uniform3fv(uniforms.u_peach, hexToRgb01(config.colors.peach));
      gl.uniform3fv(uniforms.u_blush, hexToRgb01(config.colors.blush));
    }

    function bindEvents() {
      window.addEventListener("resize", handleResize, { passive: true });
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("blur", handlePointerLeave, { passive: true });

      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(targetCanvas.parentElement || targetCanvas);
      }

      if (typeof motionQuery.addEventListener === "function") {
        motionQuery.addEventListener("change", handleMotionPreferenceChange);
      } else if (typeof motionQuery.addListener === "function") {
        motionQuery.addListener(handleMotionPreferenceChange);
      }
    }

    function unbindEvents() {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handlePointerLeave);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", handleMotionPreferenceChange);
      } else if (typeof motionQuery.removeListener === "function") {
        motionQuery.removeListener(handleMotionPreferenceChange);
      }
    }

    function handleResize() {
      resize();
      schedule();
    }

    function handlePointerMove(event) {
      const rect = targetCanvas.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        if (mouse.inside) {
          handlePointerLeave();
        }

        return;
      }

      const nextX = (event.clientX - rect.left) / Math.max(rect.width, 1);
      const nextY = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
      const dx = nextX - mouse.target[0];
      const dy = nextY - mouse.target[1];

      mouse.target[0] = clamp01(nextX);
      mouse.target[1] = clamp01(nextY);
      mouse.inside = true;
      mouse.energy = Math.min(1, mouse.energy + Math.hypot(dx, dy) * 8.0 + 0.035);

      schedule();
    }

    function handlePointerLeave() {
      mouse.inside = false;
      mouse.target[0] = 0.48;
      mouse.target[1] = 0.46;
      schedule();
    }

    function handleMotionPreferenceChange() {
      startTime = performance.now();
      previousTime = startTime;
      needsRender = true;
      schedule();
    }

    function resize() {
      const viewport = getCanvasSize(targetCanvas);
      const dpr = Math.min(window.devicePixelRatio || 1, config.maxPixelRatio);
      const width = Math.max(1, Math.floor(viewport.width * dpr));
      const height = Math.max(1, Math.floor(viewport.height * dpr));

      if (targetCanvas.width !== width || targetCanvas.height !== height) {
        targetCanvas.width = width;
        targetCanvas.height = height;
        gl.viewport(0, 0, width, height);
        needsRender = true;
      }
    }

    function updateMouse(now) {
      const dt = Math.min(Math.max((now - previousTime) / 1000, 1 / 120), 0.08);
      previousTime = now;

      const frameScale = Math.max(dt * 60, 0.001);
      const follow = 1 - Math.pow(1 - config.relaxation, frameScale);
      const damping = Math.pow(config.damping, frameScale);

      mouse.previous[0] = mouse.current[0];
      mouse.previous[1] = mouse.current[1];
      mouse.current[0] += (mouse.target[0] - mouse.current[0]) * follow;
      mouse.current[1] += (mouse.target[1] - mouse.current[1]) * follow;

      const rawVelocityX = (mouse.current[0] - mouse.previous[0]) / frameScale;
      const rawVelocityY = (mouse.current[1] - mouse.previous[1]) / frameScale;

      mouse.velocity[0] = mouse.velocity[0] * damping + rawVelocityX * (1 - damping);
      mouse.velocity[1] = mouse.velocity[1] * damping + rawVelocityY * (1 - damping);

      const velocityEnergy = Math.min(1, Math.hypot(rawVelocityX, rawVelocityY) * 30);
      const idleDecay = mouse.inside ? damping : Math.pow(config.damping * 0.96, frameScale);
      mouse.energy = Math.max(velocityEnergy, mouse.energy * idleDecay);
      mouse.active += (mouse.energy - mouse.active) * follow;
    }

    function render(now) {
      rafId = 0;
      updateMouse(now);

      const reducedMotion = motionQuery.matches;
      const elapsed = reducedMotion ? 0 : ((now - startTime) / 1000) * config.animationSpeed;

      gl.useProgram(program);
      gl.uniform2f(uniforms.u_resolution, targetCanvas.width, targetCanvas.height);
      gl.uniform1f(uniforms.u_time, elapsed);
      gl.uniform2f(uniforms.u_mouse, mouse.current[0], mouse.current[1]);
      gl.uniform2f(uniforms.u_mouse_velocity, mouse.velocity[0], mouse.velocity[1]);
      gl.uniform1f(uniforms.u_mouse_active, mouse.active);
      gl.uniform1f(
        uniforms.u_mouse_strength,
        reducedMotion ? config.mouseStrength * 0.35 : config.mouseStrength
      );
      gl.uniform1f(uniforms.u_mouse_radius, config.mouseRadius);
      gl.uniform1f(uniforms.u_softness, config.softness);
      gl.uniform1f(uniforms.u_grain_amount, config.grainAmount);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      needsRender = false;

      if (!destroyed && (!reducedMotion || needsMotionFrame())) {
        schedule();
      }
    }

    function needsMotionFrame() {
      return (
        needsRender ||
        mouse.active > 0.002 ||
        mouse.energy > 0.002 ||
        Math.abs(mouse.velocity[0]) + Math.abs(mouse.velocity[1]) > 0.0002
      );
    }

    function schedule() {
      if (!rafId && !destroyed) {
        rafId = window.requestAnimationFrame(render);
      }
    }

    function destroy() {
      destroyed = true;
      unbindEvents();

      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    }

    function update(nextConfig) {
      Object.assign(config, nextConfig || {});

      if (nextConfig && nextConfig.colors) {
        config.colors = Object.assign({}, CONFIG.colors, nextConfig.colors);
        uploadStaticUniforms();
      }

      needsRender = true;
      schedule();
    }

    return {
      config,
      destroy,
      resize: handleResize,
      update,
    };
  };

  const createProgram = (gl, vertexSource, fragmentSource) => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || "Unable to link WebGL program.";
      gl.deleteProgram(program);
      throw new Error(message);
    }

    return program;
  };

  const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || "Unable to compile WebGL shader.";
      gl.deleteShader(shader);
      throw new Error(message);
    }

    return shader;
  };

  const getUniforms = (gl, program, names) =>
    names.reduce((uniforms, name) => {
      uniforms[name] = gl.getUniformLocation(program, name);
      return uniforms;
    }, {});

  const hexToRgb01 = (hex) => {
    const clean = hex.replace("#", "").trim();
    const value =
      clean.length === 3
        ? clean
            .split("")
            .map((char) => char + char)
            .join("")
        : clean;

    const intValue = parseInt(value, 16);

    return new Float32Array([
      ((intValue >> 16) & 255) / 255,
      ((intValue >> 8) & 255) / 255,
      (intValue & 255) / 255,
    ]);
  };

  const clamp01 = (value) => Math.min(1, Math.max(0, value));

  const getCanvasSize = (targetCanvas) => {
    const host = targetCanvas.parentElement || targetCanvas;

    return {
      width: Math.ceil(Math.max(host.clientWidth || targetCanvas.clientWidth || 0, 1)),
      height: Math.ceil(Math.max(host.clientHeight || targetCanvas.clientHeight || 0, 1)),
    };
  };

  try {
    window.createFluidGradientBackground = createFluidBackground;
    window.FluidGradientBackground = createFluidBackground(canvas, CONFIG);
  } catch (error) {
    document.documentElement.classList.add("webgl-fallback");
    console.error(error);
  }
})();
