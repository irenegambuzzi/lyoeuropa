/* ============================================================
   LYO EUROPA — Magic System
   Three.js Starfield · GSAP ScrollTrigger · Hyperspace
   ============================================================ */

(function () {
  'use strict';

  /* ─── STARFIELD (Three.js) ─── */
  const SF = (() => {
    let scene, camera, renderer, stars, nebulaParticles;
    let warpSpeed = 0;
    let targetWarp = 0;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let raf;
    let canvas;
    let fruitSprites = [];
    let fruitTime = 0;

    function init() {
      canvas = document.getElementById('starfield-canvas');
      if (!canvas || typeof THREE === 'undefined') return;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
      camera.position.z = 800;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);

      buildStars();
      buildNebula();
      bindEvents();
      animate();
    }

    function buildStars() {
      const count = 4000;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 3200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 3200;

        const rand = Math.random();
        if (rand > 0.96) {
          // sage green stars
          colors[i * 3]     = 0.53; colors[i * 3 + 1] = 0.67; colors[i * 3 + 2] = 0.56;
          sizes[i] = 1.8;
        } else if (rand > 0.92) {
          // gold stars
          colors[i * 3]     = 0.79; colors[i * 3 + 1] = 0.66; colors[i * 3 + 2] = 0.30;
          sizes[i] = 1.5;
        } else if (rand > 0.85) {
          // cold blue
          colors[i * 3]     = 0.55; colors[i * 3 + 1] = 0.72; colors[i * 3 + 2] = 0.88;
          sizes[i] = 1.2;
        } else {
          // white/blue-white
          const b = 0.55 + Math.random() * 0.45;
          colors[i * 3] = b; colors[i * 3 + 1] = b; colors[i * 3 + 2] = b + 0.05;
          sizes[i] = 0.4 + Math.random() * 1.1;
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const mat = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        sizeAttenuation: true,
      });

      stars = new THREE.Points(geo, mat);
      scene.add(stars);
    }

    function buildNebula() {
      const count = 300;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const radius = 400 + Math.random() * 1200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        colors[i * 3]     = 0.42; colors[i * 3 + 1] = 0.56; colors[i * 3 + 2] = 0.44;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 4,
        vertexColors: true,
        transparent: true,
        opacity: 0.12,
        sizeAttenuation: true,
      });

      nebulaParticles = new THREE.Points(geo, mat);
      scene.add(nebulaParticles);
    }

    function bindEvents() {
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      document.addEventListener('mousemove', e => {
        targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
        targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
      });

      let lastScroll = 0;
      window.addEventListener('scroll', () => {
        const delta = window.scrollY - lastScroll;
        targetWarp += Math.abs(delta) * 0.006;
        lastScroll = window.scrollY;
      }, { passive: true });
    }

    function animate() {
      raf = requestAnimationFrame(animate);

      // Smooth mouse parallax
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Smooth warp decay
      targetWarp *= 0.94;
      warpSpeed += (targetWarp - warpSpeed) * 0.08;

      // Camera drift + mouse parallax
      camera.position.x += (mouseX * 80 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 60 - camera.position.y) * 0.02;

      // Warp: move camera forward
      camera.position.z -= warpSpeed * 12;
      if (camera.position.z < -400) camera.position.z = 800;

      // Slow rotation
      if (stars) {
        stars.rotation.y += 0.00008;
        stars.rotation.x += 0.00003;
      }
      if (nebulaParticles) {
        nebulaParticles.rotation.y -= 0.00006;
      }

      // Animate fruit sprites
      if (fruitSprites.length) {
        fruitTime += 0.005;
        fruitSprites.forEach(s => {
          const d = s.userData;
          s.position.x += d.vx + Math.sin(fruitTime * 0.4 + d.phase) * d.amp * 0.012;
          s.position.y += d.vy + Math.cos(fruitTime * 0.32 + d.phase) * d.amp * 0.009;
          s.material.rotation += d.rotSpeed;
          // Horizontal/vertical wrap
          if (s.position.x >  750) s.position.x = -750;
          if (s.position.x < -750) s.position.x =  750;
          if (s.position.y >  460) s.position.y = -460;
          if (s.position.y < -460) s.position.y =  460;
          // When fruit drifts behind camera, reset ahead
          if (s.position.z > camera.position.z + 60) {
            s.position.z = camera.position.z - 600 - Math.random() * 400;
            s.position.x = (Math.random() - 0.5) * 1300;
            s.position.y = (Math.random() - 0.5) * 750;
          }
        });
      }

      renderer.render(scene, camera);
    }

    function triggerWarp(intensity = 6) {
      targetWarp = intensity;
    }

    function stopWarp() {
      targetWarp = 0;
    }

    function loadFruits(paths) {
      if (typeof THREE === 'undefined' || !scene) return;
      const loader = new THREE.TextureLoader();
      const totalCount = window.innerWidth < 768 ? 12 : 20;
      const perType = Math.max(1, Math.ceil(totalCount / paths.length));

      paths.forEach(path => {
        loader.load(path, texture => {
          for (let i = 0; i < perType; i++) {
            const mat = new THREE.SpriteMaterial({
              map: texture,
              transparent: true,
              opacity: 0.16 + Math.random() * 0.20,
              depthWrite: false,
            });
            const sprite = new THREE.Sprite(mat);
            const scale = 42 + Math.random() * 58;
            sprite.scale.set(scale, scale, 1);
            sprite.position.set(
              (Math.random() - 0.5) * 1300,
              (Math.random() - 0.5) * 750,
              camera.position.z - 120 - Math.random() * 680
            );
            sprite.userData = {
              vx:       (Math.random() - 0.5) * 0.18,
              vy:       (Math.random() - 0.5) * 0.12,
              rotSpeed: (Math.random() - 0.5) * 0.006,
              phase:    Math.random() * Math.PI * 2,
              amp:      0.4 + Math.random() * 0.6,
            };
            scene.add(sprite);
            fruitSprites.push(sprite);
          }
        },
        undefined,
        () => { /* silently skip missing files */ });
      });
    }

    return { init, triggerWarp, stopWarp, loadFruits };
  })();

  /* ─── CURSOR ─── */
  const Cursor = (() => {
    let cursor, ring;
    let mx = 0, my = 0, rx = 0, ry = 0;

    function init() {
      cursor = document.getElementById('cursor');
      ring   = document.getElementById('cursor-ring');
      if (!cursor) return;

      document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cursor.style.left = mx + 'px';
        cursor.style.top  = my + 'px';
      });

      animRing();
    }

    function animRing() {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
      requestAnimationFrame(animRing);
    }

    return { init };
  })();

  /* ─── NAV SCROLL ─── */
  function initNav() {
    const nav = document.querySelector('.lyo-nav');
    if (!nav) return;
    const update = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ─── HYPERSPACE PAGE TRANSITION ─── */
  const Hyperspace = (() => {
    let overlay;

    function init() {
      overlay = document.getElementById('page-transition');
      if (!overlay) return;

      // Fade in — page arrived
      overlay.style.opacity = '1';
      requestAnimationFrame(() => {
        overlay.style.transition = 'opacity 0.7s ease';
        overlay.style.opacity = '0';
      });

      // Bind all internal links
      document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
        link.addEventListener('click', e => {
          e.preventDefault();
          exit(href);
        });
      });
    }

    function exit(url) {
      SF.triggerWarp(18);
      if (overlay) {
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity = '0.7';
        setTimeout(() => {
          overlay.style.opacity = '1';
          setTimeout(() => window.location.href = url, 200);
        }, 500);
      } else {
        setTimeout(() => window.location.href = url, 600);
      }
    }

    return { init };
  })();

  /* ─── REVEAL ON SCROLL ─── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
  }

  /* ─── 3D TILT ─── */
  function initTilt() {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateY(${x * 11}deg) rotateX(${-y * 9}deg) translateZ(10px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(700px) rotateY(0) rotateX(0) translateZ(0)';
      });
    });
  }

  /* ─── COUNTER ANIMATION ─── */
  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const dur = 1800;
        const start = performance.now();
        const isFloat = target % 1 !== 0;

        function step(now) {
          const t = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const val = target * eased;
          el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.floor(val)) + suffix;
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = prefix + target + suffix;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    els.forEach(el => obs.observe(el));
  }

  /* ─── TEXT SCRAMBLE ─── */
  function initScramble() {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*#@+-=';
    document.querySelectorAll('[data-scramble]').forEach(el => {
      const original = el.textContent;
      let frame = 0;
      let raf;

      el.addEventListener('mouseenter', () => {
        cancelAnimationFrame(raf);
        frame = 0;
        const maxFrames = original.length * 2;

        function update() {
          const progress = frame / maxFrames;
          const revealedChars = Math.floor(progress * original.length);
          el.textContent = original.split('').map((char, i) => {
            if (char === ' ') return ' ';
            if (i < revealedChars) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          }).join('');
          frame++;
          if (frame <= maxFrames) raf = requestAnimationFrame(update);
          else el.textContent = original;
        }
        update();
      });
    });
  }

  /* ─── THERMOMETER SCROLL ─── */
  function initThermometer() {
    const section = document.getElementById('process');
    if (!section) return;

    const phases = [
      {
        temp: 20, label: 'Temperatura ambiente',
        desc: 'Il prodotto fresco entra nella camera di liofilizzazione. Ancora vivo, ancora intero.',
        badge: '↓ Inizio del viaggio',
        step: 'Prodotto fresco in entrata',
        detail: 'Materie prime selezionate: vegetali, frutta, erbe, formaggi, carne, pesce.',
        fillPct: 18,
        bulbColor: 'radial-gradient(circle at 35% 35%, #e8885c, #c44d3a)',
        bulbShadow: '0 0 35px rgba(196,77,58,0.6)',
        fillColor: 'linear-gradient(to top, #c44d3a, #e8885c88)',
        bgTint: 'rgba(196,77,58,0.04)', stars: 0
      },
      {
        temp: -20, label: 'Primo congelamento',
        desc: 'La temperatura scende. Le cellule rallentano. Il prodotto inizia la sua trasformazione silenziosa.',
        badge: '❄ Congelamento primario',
        step: 'Abbassamento termico rapido',
        detail: 'La velocità di congelamento preserva la struttura cellulare intatta.',
        fillPct: 40,
        bulbColor: 'radial-gradient(circle at 35% 35%, #9fc7de, #5a8fa8)',
        bulbShadow: '0 0 35px rgba(90,143,168,0.5)',
        fillColor: 'linear-gradient(to top, #5a8fa8, #9fc7de88)',
        bgTint: 'rgba(90,143,168,0.06)', stars: 0.3
      },
      {
        temp: -50, label: 'Congelamento profondo',
        desc: 'Siamo vicini alle temperature dello spazio interplanetario. Tutto è cristallo puro.',
        badge: '🌌 Zona cosmica',
        step: 'Cristallizzazione completa',
        detail: "A −50°C ogni molecola d'acqua è solidificata. Il prodotto è pronto per la sublimazione.",
        fillPct: 64,
        bulbColor: 'radial-gradient(circle at 35% 35%, #7aaad4, #3a6fa5)',
        bulbShadow: '0 0 40px rgba(58,111,165,0.6)',
        fillColor: 'linear-gradient(to top, #3a6fa5, #7aaad488)',
        bgTint: 'rgba(58,111,165,0.08)', stars: 0.6
      },
      {
        temp: -80, label: 'Temperatura dello spazio',
        desc: 'Come nello spazio cosmico. Il vuoto viene applicato. L\'acqua sublima: da ghiaccio a vapore, senza passare per lo stato liquido.',
        badge: '✦ Sublimazione sotto vuoto',
        step: 'Il momento della magia',
        detail: 'La pressione cala a pochi millibar. Il ghiaccio diventa vapore. Sapori, colori, vitamine — restano.',
        fillPct: 90,
        bulbColor: 'radial-gradient(circle at 35% 35%, #5580b5, #1a3a60)',
        bulbShadow: '0 0 50px rgba(26,58,96,0.9), 0 0 100px rgba(107,143,113,0.15)',
        fillColor: 'linear-gradient(to top, #1a3a60, #5580b588)',
        bgTint: 'rgba(107,143,113,0.05)', stars: 1
      },
      {
        temp: -50, label: 'Essiccazione secondaria',
        desc: 'Il prodotto liofilizzato. Meno dell\'1% di umidità rimane. Leggero come l\'aria, intenso come la vita.',
        badge: '✓ Prodotto pronto',
        step: 'Il risultato finale',
        detail: 'Aromi, vitamine, colori: tutto preservato. Nessun conservante. Nessun additivo. Solo natura pura.',
        fillPct: 56,
        bulbColor: 'radial-gradient(circle at 35% 35%, #8aaa90, #4a6b50)',
        bulbShadow: '0 0 35px rgba(107,143,113,0.5)',
        fillColor: 'linear-gradient(to top, #4a6b50, #8aaa9088)',
        bgTint: 'rgba(107,143,113,0.08)', stars: 0.5
      }
    ];

    // Build dots
    const dotsEl = document.getElementById('thermoProgressDots');
    if (dotsEl) {
      phases.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'progress-dot' + (i === 0 ? ' active' : '');
        d.id = 'pdot-' + i;
        dotsEl.appendChild(d);
      });
    }

    // Build CSS stars
    const starsEl = document.getElementById('starsPhase');
    if (starsEl) {
      for (let i = 0; i < 140; i++) {
        const s = document.createElement('div');
        s.className = 'star-small';
        s.style.cssText = `width:${Math.random() * 2.5 + 0.5}px;height:${Math.random() * 2.5 + 0.5}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${Math.random() * 3 + 1}s;animation-delay:${Math.random() * 2}s`;
        starsEl.appendChild(s);
      }
    }

    let curPhase = -1;
    function setPhase(idx) {
      if (idx === curPhase) return;
      curPhase = idx;
      const p = phases[idx];

      const tempEl = document.getElementById('tempDisplay');
      if (tempEl) {
        tempEl.textContent = (p.temp > 0 ? '+' : '') + p.temp + '°';
        tempEl.style.color = p.temp < -40 ? '#7aaad4' : p.temp < 0 ? '#aaccdd' : 'var(--ivory)';
      }

      const labelEl = document.getElementById('phaseLabel');
      if (labelEl) labelEl.textContent = p.label;

      const descEl = document.getElementById('phaseDesc');
      if (descEl) descEl.textContent = p.desc;

      const badgeEl = document.getElementById('phaseBadge');
      if (badgeEl) badgeEl.textContent = p.badge;

      const stepEl = document.getElementById('processStep');
      if (stepEl) stepEl.textContent = p.step;

      const detailEl = document.getElementById('processDetail');
      if (detailEl) detailEl.textContent = p.detail;

      const fill = document.getElementById('thermoFill');
      if (fill) { fill.style.height = p.fillPct + '%'; fill.style.background = p.fillColor; }

      const bulb = document.getElementById('thermoBulb');
      if (bulb) { bulb.style.background = p.bulbColor; bulb.style.boxShadow = p.bulbShadow; }

      const bg = document.getElementById('thermoBg');
      if (bg) bg.style.background = 'radial-gradient(ellipse 60% 80% at 50% 50%,' + p.bgTint + ' 0%,transparent 70%)';

      if (starsEl) starsEl.style.opacity = p.stars;

      // Dots
      phases.forEach((_, i) => {
        const d = document.getElementById('pdot-' + i);
        if (d) d.className = 'progress-dot' + (i === idx ? ' active' : '');
      });

      // Warp when hitting space temperature
      if (idx === 3) SF.triggerWarp(4);
    }

    setPhase(0);

    window.addEventListener('scroll', () => {
      const rect = section.getBoundingClientRect();
      const scrolled = -rect.top;
      const sH = section.offsetHeight - window.innerHeight;
      if (scrolled < 0 || scrolled > sH) return;
      setPhase(Math.min(phases.length - 1, Math.floor(scrolled / sH * phases.length)));
    }, { passive: true });
  }

  /* ─── GSAP SCROLL ANIMATIONS ─── */
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Hero parallax
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      gsap.to(heroContent, {
        y: -60,
        opacity: 0.3,
        ease: 'none',
        scrollTrigger: { trigger: '.lyo-hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
      });
    }

    // Sections 3D entrance
    gsap.utils.toArray('.gsap-section').forEach(section => {
      gsap.fromTo(section,
        { rotateX: 4, opacity: 0, y: 60 },
        {
          rotateX: 0, opacity: 1, y: 0,
          duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Numbers count-up with GSAP
    gsap.utils.toArray('.number-value[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to({ val: 0 }, {
            val: target,
            duration: 2,
            ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(this.targets()[0].val) + suffix; }
          });
        }
      });
    });
  }

  /* ─── HORIZONTAL PRODUCTS SCROLL ─── */
  function initHorizontalScroll() {
    const track = document.querySelector('.h-scroll-track');
    const section = document.querySelector('.h-scroll-section');
    if (!track || !section) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const panels = gsap.utils.toArray('.h-scroll-track > .card');
    const totalWidth = panels.length * (panels[0].offsetWidth + 1) - window.innerWidth;

    gsap.to(track, {
      x: -totalWidth,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin: true,
        scrub: 1,
        end: () => '+=' + totalWidth,
      }
    });
  }

  /* ─── COOKIE BANNER ─── */
  function initCookieBanner() {
    if (localStorage.getItem('lyo_cookie_consent')) return;
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<div class="cookie-text">' +
          '<strong>Cookie</strong> — utilizziamo solo cookie tecnici necessari al funzionamento del sito. ' +
          'Nessuna profilazione. ' +
          '<a href="cookie-policy.html">Cookie Policy</a> &middot; <a href="privacy-policy.html">Privacy Policy</a>.' +
        '</div>' +
        '<div class="cookie-actions">' +
          '<button class="cookie-btn cookie-btn-secondary" id="lyoCookieDeny">Solo necessari</button>' +
          '<button class="cookie-btn cookie-btn-primary" id="lyoCookieAccept">Ho capito</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    setTimeout(function() { banner.classList.add('visible'); }, 900);
    function dismiss(val) {
      localStorage.setItem('lyo_cookie_consent', val);
      banner.style.transition = 'transform 0.4s ease-in';
      banner.classList.remove('visible');
      setTimeout(function() { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 450);
    }
    var btnA = document.getElementById('lyoCookieAccept');
    var btnD = document.getElementById('lyoCookieDeny');
    if (btnA) btnA.addEventListener('click', function() { dismiss('accepted'); });
    if (btnD) btnD.addEventListener('click', function() { dismiss('minimal'); });
  }

  /* ─── MOBILE NAV ─── */
  function initMobileNav() {
    var nav = document.querySelector('.lyo-nav');
    if (!nav) return;

    var btn = document.createElement('button');
    btn.className = 'nav-hamburger';
    btn.setAttribute('aria-label', 'Apri menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(btn);

    var overlay = document.createElement('div');
    overlay.className = 'nav-mobile-overlay';

    var linksUl = document.createElement('ul');
    linksUl.className = 'nav-mobile-links';
    nav.querySelectorAll('.nav-links a').forEach(function(a) {
      var li = document.createElement('li');
      var link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.textContent = a.textContent.trim();
      if (a.classList.contains('active')) link.className = 'active';
      li.appendChild(link);
      linksUl.appendChild(li);
    });

    var actionsDiv = document.createElement('div');
    actionsDiv.className = 'nav-mobile-actions';
    nav.querySelectorAll('.nav-area-btn').forEach(function(a) {
      var link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.className = a.className;
      link.textContent = a.textContent.trim();
      actionsDiv.appendChild(link);
    });
    var langBtn = nav.querySelector('.nav-lang');
    if (langBtn) {
      var lang = document.createElement('a');
      lang.setAttribute('href', '#');
      lang.className = 'nav-lang';
      lang.textContent = langBtn.textContent.trim();
      actionsDiv.appendChild(lang);
    }

    overlay.appendChild(linksUl);
    overlay.appendChild(actionsDiv);
    document.body.appendChild(overlay);

    function openMenu() {
      btn.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      btn.setAttribute('aria-label', 'Chiudi menu');
    }
    function closeMenu() {
      btn.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      btn.setAttribute('aria-label', 'Apri menu');
    }

    btn.addEventListener('click', function() {
      btn.classList.contains('open') ? closeMenu() : openMenu();
    });
    overlay.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ─── INIT ALL ─── */
  function boot() {
    SF.init();
    Cursor.init();
    initNav();
    Hyperspace.init();
    initReveal();
    initTilt();
    initCounters();
    initScramble();
    initThermometer();
    initGSAP();
    initHorizontalScroll();
    initMobileNav();
    initCookieBanner();
    initFruits();
  }

  /* ─── FRUIT LAYER (home page only) ─── */
  function initFruits() {
    // Only activate on the home page (identified by the hero section)
    if (!document.querySelector('.hero-title')) return;
    // Small delay to ensure SF scene is fully initialised
    setTimeout(() => {
      SF.loadFruits([
        'assets/fruits/fragola.png',
        'assets/fruits/mirtillo.png',
        'assets/fruits/lampone.png',
        'assets/fruits/kiwi.png',
        'assets/fruits/limone.png',
        'assets/fruits/arancia.png',
        'assets/fruits/fungo.png',
      ]);
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose for external use (e.g., area pages)
  window.LYOMagic = { SF };
})();
