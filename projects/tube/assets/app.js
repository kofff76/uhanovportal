(() => {
  const trigger = document.querySelector('[data-menu-trigger]');
  const drawer = document.querySelector('[data-drawer]');
  const backdrop = document.querySelector('[data-backdrop]');
  const SESSION_KEY = 'harmony_drive_tube_demo_session';
  const USER_KEY = 'harmony_drive_tube_demo_user';

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  };
  const isLogged = () => localStorage.getItem(SESSION_KEY) === '1';
  const ensureUser = () => getUser() || {name:'Сергей', email:'demo@harmony.local', city:'Тула', bio:'Музыкант и автор Harmony Drive Tube.'};
  const saveUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

  const setMenu = (open) => {
    if (!trigger || !drawer || !backdrop) return;
    trigger.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    backdrop.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  };
  trigger?.addEventListener('click', () => setMenu(trigger.getAttribute('aria-expanded') !== 'true'));
  backdrop?.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

  // Dashboard pages imitate a real authorization boundary.
  const protectedPage = document.querySelector('main.dashboard');
  if (protectedPage && !isLogged()) {
    window.location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'cabinet.html'));
    return;
  }

  // Header login/cabinet state.
  document.querySelectorAll('[data-auth-link]').forEach((link) => {
    const user = ensureUser();
    if (isLogged()) {
      link.href = 'cabinet.html';
      link.textContent = (user.name || 'П').trim().charAt(0).toUpperCase();
      link.setAttribute('aria-label', 'Личный кабинет');
    } else {
      link.href = 'login.html';
      link.textContent = 'В';
      link.setAttribute('aria-label', 'Войти');
    }
  });

  document.querySelectorAll('[data-user-name]').forEach((node) => node.textContent = ensureUser().name || 'Сергей');

  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', () => {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = 'login.html';
    });
  });

  // Demo auth. No network requests.
  const loginForm = document.querySelector('[data-demo-login]');
  loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(loginForm);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const status = document.querySelector('[data-auth-status]');
    if (!email || password.length < 6) {
      if (status) status.textContent = 'Введите корректный e-mail и пароль от 6 символов.';
      return;
    }
    const old = getUser() || {};
    saveUser({...ensureUser(), ...old, email});
    localStorage.setItem(SESSION_KEY, '1');
    if (status) status.textContent = 'Демо-сессия создана. Открываю кабинет…';
    window.location.href = 'cabinet.html';
  });

  document.querySelector('[data-demo-fill]')?.addEventListener('click', () => {
    const form = document.querySelector('[data-demo-login]');
    if (!form) return;
    form.elements.email.value = 'demo@harmony.local';
    form.elements.password.value = '123456';
  });

  const registerForm = document.querySelector('[data-demo-register]');
  registerForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(registerForm);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const status = document.querySelector('[data-auth-status]');
    if (!name || !email || password.length < 6 || data.get('consent') !== 'on') {
      if (status) status.textContent = 'Заполните поля и подтвердите правила демо.';
      return;
    }
    saveUser({name, email, city:'', bio:''});
    localStorage.setItem(SESSION_KEY, '1');
    if (status) status.textContent = 'Демо-профиль создан. Открываю кабинет…';
    window.location.href = 'cabinet.html';
  });

  // Profile persistence for the demo.
  const profileForm = document.querySelector('[data-profile-form]');
  if (profileForm) {
    const user = ensureUser();
    ['name','email','city','bio'].forEach((key) => { if (profileForm.elements[key]) profileForm.elements[key].value = user[key] || ''; });
    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(profileForm);
      const next = {name:String(data.get('name')||''), email:String(data.get('email')||''), city:String(data.get('city')||''), bio:String(data.get('bio')||'')};
      saveUser(next);
      localStorage.setItem(SESSION_KEY, '1');
      const status = document.querySelector('[data-profile-status]');
      if (status) status.textContent = 'Сохранено локально в демонстрационной версии.';
    });
  }

  // Studio upload simulation.
  const demoFile = document.querySelector('[data-demo-file]');
  const demoFileButton = document.querySelector('[data-demo-file-button]');
  const uploadStatus = document.querySelector('[data-upload-status]');
  demoFileButton?.addEventListener('click', () => demoFile?.click());
  demoFile?.addEventListener('change', () => {
    const file = demoFile.files?.[0];
    if (!file) return;
    const mb = (file.size / 1024 / 1024).toFixed(1);
    if (uploadStatus) uploadStatus.textContent = `Выбран: ${file.name} · ${mb} МБ. MVP-демо: показаны этапы проверки и публикации без фактической отправки на сервер.`;
    localStorage.setItem('harmony_drive_tube_last_demo_upload', JSON.stringify({name:file.name,size:file.size,at:Date.now()}));
  });

  document.querySelectorAll('[data-subscribe]').forEach((button) => {
    button.addEventListener('click', () => {
      const active = button.dataset.active === 'true';
      button.dataset.active = String(!active);
      button.textContent = active ? 'Подписаться' : 'Вы подписаны';
      localStorage.setItem('harmony_drive_tube_demo_subscribed', String(!active));
    });
  });

  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
    });
  });

  document.querySelectorAll('[data-search-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = form.querySelector('input[name="q"]')?.value.trim();
      if (query) window.location.href = `catalog.html?q=${encodeURIComponent(query)}`;
    });
  });

  const player = document.querySelector('.player-play');
  player?.addEventListener('click', () => {
    const active = player.dataset.playing === 'true';
    player.dataset.playing = String(!active);
    player.textContent = active ? '▶' : '❚❚';
    player.setAttribute('aria-label', active ? 'Воспроизвести' : 'Пауза');
  });

  const agentForm = document.querySelector('[data-agent-form]');
  if (agentForm) {
    const status = document.querySelector('[data-agent-status]');
    agentForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const prompt = agentForm.querySelector('textarea')?.value.trim();
      if (!prompt) { if (status) status.textContent = 'Введите задачу для агента.'; return; }
      if (status) status.textContent = 'MVP-демо: задача сформирована локально. При подключении backend она будет отправляться во внутренний AI Gateway.';
    });
  }
})();
