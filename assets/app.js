(() => {
  const body = document.body;
  const giftModal = document.querySelector('[data-gift-modal]');
  const wishModal = document.querySelector('[data-wish-modal]');
  const lightbox = document.querySelector('.lightbox');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const syncBodyLock = () => {
    const giftOpen = giftModal?.classList.contains('open');
    const wishOpen = wishModal?.classList.contains('open');
    const lightboxOpen = lightbox?.classList.contains('open');
    body.classList.toggle('no-scroll', Boolean(giftOpen || wishOpen || lightboxOpen));
  };

  const nav = document.querySelector('.site-nav');
  const paintNav = () => nav?.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * .72);
  paintNav();
  window.addEventListener('scroll', paintNav, { passive: true });
  if (window.location.hash) {
    window.addEventListener('load', () => {
      setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView(), 120);
    });
  }

  const countdown = document.querySelector('[data-countdown]');
  if (countdown) {
    const target = new Date(countdown.dataset.countdown).getTime();
    const parts = {
      days: countdown.querySelector('[data-days]'),
      hours: countdown.querySelector('[data-hours]'),
      minutes: countdown.querySelector('[data-minutes]'),
      seconds: countdown.querySelector('[data-seconds]')
    };
    const updatePart = (element, value) => {
      const next = String(value).padStart(2, '0');
      if (element.textContent !== next) element.textContent = next;
    };
    const paintCountdown = () => {
      const diff = Math.max(0, target - Date.now());
      const day = 86400000, hour = 3600000, minute = 60000;
      updatePart(parts.days, Math.floor(diff / day));
      updatePart(parts.hours, Math.floor((diff % day) / hour));
      updatePart(parts.minutes, Math.floor((diff % hour) / minute));
      updatePart(parts.seconds, Math.floor((diff % minute) / 1000));
    };
    paintCountdown();
    setInterval(paintCountdown, 1000);
  }

  const revealItems = document.querySelectorAll('.reveal');
  // Images remain visible at all times; only text uses scroll entrance motion.
  document.querySelectorAll('.reveal-clip').forEach(item => item.classList.add('visible'));
  document.querySelectorAll('.triptych-grid .reveal-clip, .gallery-grid .reveal-clip').forEach((item, index) => {
    item.style.transitionDelay = `${(index % 3) * 110}ms`;
  });
  if (window.location.hash) {
    revealItems.forEach(item => item.classList.add('visible'));
  } else if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach(item => {
      // Keep above-the-fold content visible; animate only content discovered by scrolling.
      if (item.getBoundingClientRect().top < window.innerHeight * .92) {
        item.classList.add('visible');
      } else {
        item.classList.add('reveal-pending');
        revealObserver.observe(item);
      }
    });
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  if (!reducedMotion && window.matchMedia('(min-width: 821px)').matches) {
    const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
    let ticking = false;
    const paintParallax = () => {
      parallaxItems.forEach(item => {
        const rect = item.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const speed = Number(item.dataset.parallax || .05);
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
        item.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(paintParallax);
        ticking = true;
      }
    }, { passive: true });
    paintParallax();
  }

  if (lightbox) {
    const images = [...document.querySelectorAll('[data-gallery] .gallery-item img')];
    const target = lightbox.querySelector('figure img');
    const caption = lightbox.querySelector('figcaption');
    let current = 0;
    let touchStart = 0;
    const show = index => {
      current = (index + images.length) % images.length;
      target.src = images[current].currentSrc || images[current].src;
      target.alt = images[current].alt;
      caption.textContent = `${String(current + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')} · ${images[current].alt}`;
    };
    const open = index => {
      show(index);
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      syncBodyLock();
      lightbox.querySelector('[data-lightbox-close]')?.focus({ preventScroll: true });
    };
    const close = () => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      syncBodyLock();
    };
    images.forEach((image, index) => image.addEventListener('click', () => open(index)));
    lightbox.querySelector('[data-lightbox-close]')?.addEventListener('click', close);
    lightbox.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(current - 1));
    lightbox.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', event => { if (event.target === lightbox) close(); });
    lightbox.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', event => {
      const distance = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(distance) > 45) show(current + (distance < 0 ? 1 : -1));
    }, { passive: true });
    document.addEventListener('keydown', event => {
      if (!lightbox.classList.contains('open')) return;
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
      if (event.key === 'Escape') close();
    });
  }

  if (giftModal) {
    let closeTimer;
    const openGift = () => {
      clearTimeout(closeTimer);
      giftModal.hidden = false;
      requestAnimationFrame(() => {
        giftModal.classList.add('open');
        syncBodyLock();
        giftModal.querySelector('.gift-close')?.focus({ preventScroll: true });
      });
    };
    const closeGift = () => {
      giftModal.classList.remove('open');
      syncBodyLock();
      closeTimer = setTimeout(() => { giftModal.hidden = true; }, 360);
    };
    document.querySelectorAll('[data-gift-open]').forEach(button => button.addEventListener('click', openGift));
    giftModal.querySelectorAll('[data-gift-close]').forEach(item => item.addEventListener('click', closeGift));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && giftModal.classList.contains('open')) closeGift();
    });
    const copyButton = giftModal.querySelector('[data-copy-account]');
    copyButton?.addEventListener('click', async () => {
      const value = copyButton.dataset.account || '';
      try {
        await navigator.clipboard.writeText(value);
      } catch (_) {
        const input = document.createElement('textarea');
        input.value = value;
        input.style.cssText = 'position:fixed;opacity:0';
        body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      const oldText = copyButton.textContent;
      copyButton.textContent = 'Đã sao chép';
      setTimeout(() => { copyButton.textContent = oldText; }, 1600);
    });
  }

  if (wishModal) {
    const wishForm = wishModal.querySelector('[data-wish-form]');
    const wishStatus = wishModal.querySelector('[data-wish-status]');
    const submitButton = wishForm?.querySelector('button[type="submit"]');
    let closeTimer;
    const openWish = () => {
      clearTimeout(closeTimer);
      wishModal.hidden = false;
      requestAnimationFrame(() => {
        wishModal.classList.add('open');
        syncBodyLock();
        wishForm?.querySelector('input[name="from_name"]')?.focus({ preventScroll: true });
      });
    };
    const closeWish = () => {
      wishModal.classList.remove('open');
      syncBodyLock();
      closeTimer = setTimeout(() => { wishModal.hidden = true; }, 360);
    };
    document.querySelectorAll('[data-wish-open]').forEach(button => button.addEventListener('click', openWish));
    wishModal.querySelectorAll('[data-wish-close]').forEach(item => item.addEventListener('click', closeWish));
    wishForm?.querySelectorAll('[name="attendance"]').forEach(option => option.addEventListener('change', () => {
      wishForm.querySelectorAll('.wish-options label').forEach(label => {
        label.classList.toggle('selected', label.querySelector('input').checked);
      });
    }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && wishModal.classList.contains('open')) closeWish();
    });
    wishForm?.addEventListener('submit', async event => {
      event.preventDefault();
      if (!window.emailjs) {
        wishStatus.textContent = 'Chưa thể kết nối dịch vụ gửi lời chúc. Vui lòng thử lại sau.';
        wishStatus.dataset.state = 'error';
        return;
      }
      submitButton.disabled = true;
      submitButton.classList.add('is-sending');
      wishStatus.textContent = 'Đang gửi lời chúc…';
      wishStatus.dataset.state = 'sending';
      try {
        await window.emailjs.sendForm('service_sqjm0tc', 'template_tup36x5', wishForm, {
          publicKey: '9dB1Di23Mf-0O92pp'
        });
        wishStatus.textContent = 'Đã gửi lời chúc. Chúng mình cảm ơn bạn!';
        wishStatus.dataset.state = 'success';
        wishForm.reset();
      } catch (_) {
        wishStatus.textContent = 'Gửi chưa thành công. Vui lòng thử lại sau ít phút.';
        wishStatus.dataset.state = 'error';
      } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('is-sending');
      }
    });
  }
  const audio = document.querySelector('[data-wedding-music]');
  const musicToggle = document.querySelector('[data-music-toggle]');
  if (audio && musicToggle) {
    const playIcon = musicToggle.querySelector('[data-music-play]');
    const pauseIcon = musicToggle.querySelector('[data-music-pause]');
    let wantsToPlay = false;
    let playRequest = 0;
    const paintMusic = (playing, loading = false) => {
      musicToggle.classList.toggle('is-playing', playing);
      musicToggle.classList.toggle('is-loading', loading);
      musicToggle.setAttribute('aria-pressed', String(playing));
      musicToggle.setAttribute('aria-label', playing ? 'Tạm dừng nhạc cưới' : 'Phát nhạc cưới');
      musicToggle.title = playing ? 'Tạm dừng nhạc' : 'Phát nhạc';
      playIcon.hidden = playing;
      pauseIcon.hidden = !playing;
    };
    const stopMusic = () => {
      wantsToPlay = false;
      playRequest += 1;
      audio.pause();
      paintMusic(false);
    };
    musicToggle.addEventListener('click', async event => {
      event.preventDefault();
      if (wantsToPlay || !audio.paused) return stopMusic();
      wantsToPlay = true;
      const request = ++playRequest;
      // Make the control immediately actionable as Pause while the file buffers.
      paintMusic(true, true);
      try {
        const playPromise = audio.play();
        if (playPromise) await playPromise;
        if (!wantsToPlay || request !== playRequest) return audio.pause();
        paintMusic(true);
      } catch (_) {
        if (request === playRequest) stopMusic();
      }
    });
    audio.addEventListener('playing', () => { if (wantsToPlay) paintMusic(true); });
    audio.addEventListener('waiting', () => { if (wantsToPlay) paintMusic(true, true); });
    audio.addEventListener('canplay', () => { if (wantsToPlay && !audio.paused) paintMusic(true); });
    audio.addEventListener('pause', () => {
      if (audio.paused) {
        wantsToPlay = false;
        paintMusic(false);
      }
    });
    audio.addEventListener('ended', () => { wantsToPlay = false; paintMusic(false); });
    audio.addEventListener('error', stopMusic);
    paintMusic(false);
  }
})();