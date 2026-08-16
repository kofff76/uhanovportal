(() => {
  'use strict';
  const d = document;
  const SESSION_KEY = 'garmon_drive_webtv_mvp_session';
  const USER_KEY = 'garmon_drive_webtv_mvp_user';
  const FAV_KEY = 'garmon_drive_webtv_mvp_favorite';
  const REMINDER_KEY = 'garmon_drive_webtv_mvp_reminders';

  const getUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } };
  const user = () => getUser() || {name:'Сергей',email:'demo@webtv.local',city:'Тула',bio:'Зритель ГармоньDRIVE WEB TV.'};
  const logged = () => localStorage.getItem(SESSION_KEY) === '1';
  const saveUser = (value) => localStorage.setItem(USER_KEY, JSON.stringify(value));

  const trigger = d.querySelector('[data-menu-trigger]');
  const drawer = d.querySelector('[data-drawer]');
  const backdrop = d.querySelector('[data-backdrop]');
  const setMenu = (open) => {
    if (!trigger || !drawer || !backdrop) return;
    trigger.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    backdrop.hidden = !open;
    d.body.classList.toggle('menu-open', open);
  };
  trigger?.addEventListener('click', () => setMenu(trigger.getAttribute('aria-expanded') !== 'true'));
  backdrop?.addEventListener('click', () => setMenu(false));
  d.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Local demo auth boundary.
  if (d.querySelector('main.dashboard') && !logged()) {
    location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'cabinet.html'));
    return;
  }
  d.querySelectorAll('[data-auth-link]').forEach(link => {
    if (logged()) {
      link.href = 'cabinet.html';
      link.textContent = (user().name || 'П').trim().charAt(0).toUpperCase();
      link.setAttribute('aria-label','Личный кабинет');
    } else {
      link.href='login.html'; link.textContent='В'; link.setAttribute('aria-label','Войти');
    }
  });
  d.querySelectorAll('[data-user-name]').forEach(n => n.textContent = user().name || 'Сергей');
  d.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click',()=>{localStorage.removeItem(SESSION_KEY);location.href='login.html';}));

  const login = d.querySelector('[data-demo-login]');
  login?.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(login), email=String(data.get('email')||'').trim(), password=String(data.get('password')||'');
    const s=d.querySelector('[data-auth-status]');
    if(!email || password.length<6){ if(s)s.textContent='Введите e-mail и пароль от 6 символов.'; return; }
    saveUser({...user(),email}); localStorage.setItem(SESSION_KEY,'1'); if(s)s.textContent='MVP-сессия создана. Открываю кабинет…'; location.href='cabinet.html';
  });
  d.querySelector('[data-demo-fill]')?.addEventListener('click',()=>{const f=d.querySelector('[data-demo-login]');if(!f)return;f.elements.email.value='demo@webtv.local';f.elements.password.value='123456';});
  const reg=d.querySelector('[data-demo-register]');
  reg?.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(reg),name=String(data.get('name')||'').trim(),email=String(data.get('email')||'').trim(),password=String(data.get('password')||'');const s=d.querySelector('[data-auth-status]');if(!name||!email||password.length<6||data.get('consent')!=='on'){if(s)s.textContent='Заполните поля и подтвердите правила MVP.';return;}saveUser({name,email,city:'',bio:''});localStorage.setItem(SESSION_KEY,'1');location.href='cabinet.html';});

  const profile=d.querySelector('[data-profile-form]');
  if(profile){const u=user();['name','email','city','bio'].forEach(k=>{if(profile.elements[k])profile.elements[k].value=u[k]||''});profile.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(profile);saveUser({name:String(fd.get('name')||''),email:String(fd.get('email')||''),city:String(fd.get('city')||''),bio:String(fd.get('bio')||'')});const s=d.querySelector('[data-profile-status]');if(s)s.textContent='Сохранено локально в MVP.';});}

  // Demo player.
  d.querySelectorAll('[data-tv-play]').forEach(btn=>btn.addEventListener('click',()=>{const p=btn.closest('[data-tv-player]');const active=p?.classList.toggle('is-playing');btn.textContent=active?'❚❚':'▶';d.querySelectorAll('[data-live-state]').forEach(n=>n.textContent=active?'MVP PLAYING':'DEMO STREAM');}));

  // Channel switch changes the current program without real streaming.
  const channels={
    main:{title:'Большой концерт ГармоньDRIVE',desc:'Сцена, живой звук и главные номера коллектива.',img:'assets/img/tv-concert.webp'},
    concert:{title:'Гармонь без рамок',desc:'Концертный поток: премьеры и живые номера.',img:'assets/img/tv-group-red.webp'},
    archive:{title:'Лучшее за неделю',desc:'Архивный поток: записи эфиров и специальные программы.',img:'assets/img/tv-gold.webp'}
  };
  d.querySelectorAll('[data-channel]').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.channel,c=channels[key]; if(!c)return;
    d.querySelectorAll('[data-channel]').forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');
    d.querySelectorAll('[data-live-title]').forEach(n=>n.textContent=c.title);d.querySelectorAll('[data-live-desc]').forEach(n=>n.textContent=c.desc);
    const img=d.querySelector('[data-tv-player] img');if(img)img.src=c.img;localStorage.setItem('garmon_drive_webtv_channel',key);
  }));

  // Favorite toggle.
  const applyFav=()=>{const on=localStorage.getItem(FAV_KEY)==='1';d.querySelectorAll('[data-favorite]').forEach(b=>{b.classList.toggle('is-active',on);b.textContent=on?'✓ В избранном':'＋ В избранное';});d.querySelectorAll('[data-fav-count]').forEach(n=>n.textContent=on?'2':'1');};
  d.querySelectorAll('[data-favorite]').forEach(b=>b.addEventListener('click',()=>{localStorage.setItem(FAV_KEY,localStorage.getItem(FAV_KEY)==='1'?'0':'1');applyFav();}));applyFav();

  // Schedule day tabs and reminders.
  d.querySelectorAll('[data-day]').forEach(btn=>btn.addEventListener('click',()=>{d.querySelectorAll('[data-day]').forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');const list=d.querySelector('[data-schedule-list]');if(list){list.style.opacity='.35';setTimeout(()=>{list.style.opacity='1';},160);}}));
  const reminders=()=>Number(localStorage.getItem(REMINDER_KEY)||'0');
  d.querySelectorAll('[data-remind]').forEach(btn=>btn.addEventListener('click',()=>{const active=btn.classList.toggle('is-active');btn.textContent=active?'✓ Напомним':'Напомнить';localStorage.setItem(REMINDER_KEY,String(Math.max(0,reminders()+(active?1:-1))));d.querySelectorAll('[data-reminder-count]').forEach(n=>n.textContent=String(reminders()));}));
  d.querySelectorAll('[data-reminder-count]').forEach(n=>n.textContent=String(reminders()));

  // Filters only demonstrate UI state.
  d.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{d.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');}));
  d.querySelectorAll('[data-search-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const q=form.querySelector('input[name=q]')?.value.trim();if(q)location.href='catalog.html?q='+encodeURIComponent(q);}));

  // Editorial upload is local only.
  const file=d.querySelector('[data-demo-file]'), fileBtn=d.querySelector('[data-demo-file-button]'), uploadStatus=d.querySelector('[data-upload-status]');
  fileBtn?.addEventListener('click',()=>file?.click());
  file?.addEventListener('change',()=>{const f=file.files?.[0];if(!f)return;const mb=(f.size/1024/1024).toFixed(1);if(uploadStatus)uploadStatus.textContent=`Выбран: ${f.name} · ${mb} МБ. Файл не отправлен на сервер.`;localStorage.setItem('garmon_drive_webtv_demo_upload',JSON.stringify({name:f.name,size:f.size,at:Date.now()}));});
  d.querySelector('[data-broadcast-form]')?.addEventListener('submit',e=>{e.preventDefault();const s=d.querySelector('[data-broadcast-status]');if(s)s.textContent='MVP: программа добавлена в локальный черновик эфирной сетки.';});
  d.querySelector('[data-agent-form]')?.addEventListener('submit',e=>{e.preventDefault();const text=e.currentTarget.querySelector('textarea')?.value.trim(),s=d.querySelector('[data-agent-status]');if(!text){if(s)s.textContent='Введите задачу для AI‑редактора.';return;}if(s)s.textContent='MVP‑ответ: «Сегодня в эфире ГармоньDRIVE WEB TV — большой концерт коллектива. Живой звук, яркие номера и музыка без границ». Реальный AI Gateway не вызывался.';});

  // Local clock for the live card.
  const tick=()=>{const now=new Date();const val=now.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});d.querySelectorAll('[data-tv-clock]').forEach(n=>n.textContent=val);};tick();setInterval(tick,30000);
})();
