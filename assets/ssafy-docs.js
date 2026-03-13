(function () {
  const THEME_KEY = "ssafy-theme";
  const LEGACY_THEME_KEYS = ["theme"];

  function normalizeTheme(theme) {
    return theme === "dark" ? "dark" : "light";
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
      LEGACY_THEME_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
      console.warn("Failed to persist theme", error);
    }
  }

  function resolveTheme() {
    try {
      const storedTheme = window.localStorage.getItem(THEME_KEY);
      if (storedTheme) {
        return normalizeTheme(storedTheme);
      }

      for (const legacyKey of LEGACY_THEME_KEYS) {
        const legacyTheme = window.localStorage.getItem(legacyKey);
        if (!legacyTheme) continue;
        const normalized = normalizeTheme(legacyTheme);
        persistTheme(normalized);
        return normalized;
      }
    } catch (error) {
      console.warn("Failed to read theme", error);
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function syncThemeTargets(theme) {
    document.querySelectorAll("[data-theme-class]").forEach((element) => {
      const className = element.dataset.themeClass;
      if (!className) return;
      element.classList.toggle(className, theme === "dark");
    });

    const iconSun = document.getElementById("iconSun");
    const iconMoon = document.getElementById("iconMoon");
    if (iconSun && iconMoon) {
      if (theme === "dark") {
        iconSun.style.display = "block";
        iconMoon.style.display = "none";
      } else {
        iconSun.style.display = "none";
        iconMoon.style.display = "block";
      }
    }
  }

  function applyTheme(theme, options = {}) {
    const nextTheme = normalizeTheme(theme);
    const { persist = true, dispatch = true } = options;

    document.documentElement.setAttribute("data-theme", nextTheme);
    syncThemeTargets(nextTheme);

    if (persist) {
      persistTheme(nextTheme);
    }

    if (dispatch) {
      window.dispatchEvent(new CustomEvent("ssafy:themechange", { detail: { theme: nextTheme } }));
    }

    return nextTheme;
  }

  function updateMenuIcons(isOpen) {
    const iconHamburger = document.getElementById("iconHamburger");
    const iconClose = document.getElementById("iconClose");

    if (iconHamburger) {
      iconHamburger.style.display = isOpen ? "none" : "block";
    }

    if (iconClose) {
      iconClose.style.display = isOpen ? "block" : "none";
    }
  }

  function closeMenu() {
    const navLinks = document.getElementById("navLinks") || document.querySelector(".nav-links");
    if (!navLinks) return;
    navLinks.classList.remove("active");
    updateMenuIcons(false);
  }

  function initThemeToggle() {
    const themeToggle = document.getElementById("themeToggle");
    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      const activeTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = activeTheme === "dark" ? "light" : "dark";

      applyTheme(nextTheme);

      if (document.documentElement.dataset.reloadOnThemeToggle === "true") {
        window.location.reload();
      }
    });
  }

  function initNavigation() {
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const navLinks = document.getElementById("navLinks") || document.querySelector(".nav-links");
    const mainNav = document.querySelector(".main-nav");
    if (!hamburgerBtn || !navLinks) return;

    hamburgerBtn.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("active");
      updateMenuIcons(isOpen);
    });

    navLinks.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    window.addEventListener("scroll", () => {
      if (mainNav) {
        if (window.scrollY > 20) {
          mainNav.classList.add("scrolled");
        } else {
          mainNav.classList.remove("scrolled");
        }
      }
      updateActiveLink();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    });

    function updateActiveLink() {
      const sections = document.querySelectorAll("section[id], header[id]");
      if (!sections.length) return;

      let currentSectionId = "";
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
          currentSectionId = section.getAttribute("id");
        }
      });

      if (currentSectionId) {
        const navLinksArr = navLinks.querySelectorAll(".nav-link");
        navLinksArr.forEach((link) => {
          const href = link.getAttribute("href");
          if (!href) return;
          if (href.startsWith("#") || href.includes(window.location.pathname + "#")) {
            link.classList.remove("active");
            if (href.includes(`#${currentSectionId}`)) {
              link.classList.add("active");
            }
          }
        });
      }
    }
  }

  function initRevealObserver() {
    const targets = document.querySelectorAll(".reveal-on-scroll, .fade-up");
    if (!targets.length || typeof IntersectionObserver === "undefined") {
      targets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    targets.forEach((element) => observer.observe(element));
  }

  function initNextStepCue() {
    const nextStep = document.querySelector(".next-step-container");
    if (!nextStep || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      const isNearNextStep = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.15);
      document.body.classList.toggle("approaching-next", isNearNextStep);
    }, { threshold: [0, 0.15, 0.6] });

    observer.observe(nextStep);
  }

  const initialTheme = resolveTheme();
  document.documentElement.setAttribute("data-theme", initialTheme);

  window.SsafyDocs = {
    applyTheme,
    closeMenu,
    getTheme() {
      return document.documentElement.getAttribute("data-theme") || initialTheme;
    },
    init() {
      applyTheme(this.getTheme(), { persist: false, dispatch: false });
      initThemeToggle();
      initNavigation();
      initRevealObserver();
      initNextStepCue();
      window.dispatchEvent(new CustomEvent("ssafy:ready", { detail: { theme: this.getTheme() } }));
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    window.SsafyDocs.init();
  });
})();
