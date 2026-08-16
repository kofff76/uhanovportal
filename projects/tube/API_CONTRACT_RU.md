# Журавли Видео — API-контракт

Файл `assets/api-client.js` использует существующую сессию Django (`credentials: include`).

## Подтверждённые маршруты действующей системы

- `GET /api/v1/search?q=<query>&page=1` — реальный поиск MediaCMS.
- `GET /api/v1/whoami` — текущий пользователь.
- `POST /api/v1/login` — вход.
- `/accounts/login/` — страница входа.
- `/accounts/signup/` — страница регистрации.

## Маршруты добавляемого моста

- `GET /api/portal/home/` — агрегированные данные главной.
- `POST /api/portal/agent/jobs/` — создать AI-задачу.
- `GET /api/portal/agent/jobs/<uuid>/` — получить статус и результат.

Маршруты моста приведены как готовый Django-модуль в `backend_integration/zhuravli_bridge`. Он должен быть установлен в существующий MediaCMS после резервной копии и проверки в тестовой среде.

## Что не выдумано

Имена остальных внутренних MediaCMS endpoint'ов не зафиксированы в этом архиве. Для загрузки, каналов, рекомендаций и комментариев сначала сверяйте `cms/urls.py`, `users/urls.py`, `files/urls.py` и фактические маршруты текущего production-релиза.
