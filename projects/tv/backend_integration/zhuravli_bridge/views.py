from __future__ import annotations

import json
from typing import Any

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_GET, require_POST

from .services.ai_gateway import AIGatewayClient, AIGatewayError

ALLOWED_TASK_TYPES = {
    "transcribe",
    "subtitles",
    "metadata",
    "moderation_preview",
    "semantic_search",
    "assistant",
}
MAX_PROMPT_LENGTH = 8_000
MAX_CONTEXT_LENGTH = 24_000


def _json_body(request: HttpRequest) -> dict[str, Any]:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Некорректный JSON") from exc
    if not isinstance(payload, dict):
        raise ValueError("Ожидается JSON-объект")
    return payload


def _rate_limit(user_id: int, limit: int = 10, period_seconds: int = 3600) -> bool:
    key = f"zhuravli:agent:rate:{user_id}"
    if cache.add(key, 1, timeout=period_seconds):
        return True
    try:
        current = cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=period_seconds)
        current = 1
    return current <= limit


@require_GET
def portal_home(request: HttpRequest) -> JsonResponse:
    """Нейтральная точка конфигурации. Видео остаются в родном API MediaCMS."""
    user = request.user
    return JsonResponse({
        "project": "Журавли Видео",
        "search_endpoint": "/api/v1/search",
        "whoami_endpoint": "/api/v1/whoami",
        "authenticated": bool(user.is_authenticated),
        "user": {
            "id": user.pk,
            "name": user.get_full_name() or user.get_username(),
        } if user.is_authenticated else None,
        "features": {
            "agent": bool(getattr(settings, "AI_GATEWAY_URL", "")),
            "upload_quarantine": True,
            "manual_moderation_for_disputes": True,
        },
    })


@login_required
@require_POST
def create_agent_job(request: HttpRequest) -> JsonResponse:
    if not _rate_limit(request.user.pk):
        return JsonResponse({"detail": "Слишком много AI-задач. Повторите позже."}, status=429)

    try:
        payload = _json_body(request)
    except ValueError as exc:
        return JsonResponse({"detail": str(exc)}, status=400)

    task_type = str(payload.get("task_type", "assistant")).strip()
    prompt = str(payload.get("prompt", "")).strip()
    context = str(payload.get("context", "")).strip()
    media_id = payload.get("media_id")

    if task_type not in ALLOWED_TASK_TYPES:
        return JsonResponse({"detail": "Недопустимый тип задачи"}, status=400)
    if not prompt or len(prompt) > MAX_PROMPT_LENGTH:
        return JsonResponse({"detail": "Текст задачи пустой или слишком длинный"}, status=400)
    if len(context) > MAX_CONTEXT_LENGTH:
        return JsonResponse({"detail": "Контекст слишком длинный"}, status=400)

    gateway_payload = {
        "task_type": task_type,
        "prompt": prompt,
        "context": context,
        "media_id": media_id,
        "requested_by": request.user.pk,
        "source": "zhuravli-video",
    }

    try:
        result = AIGatewayClient().create_job(gateway_payload)
    except AIGatewayError as exc:
        return JsonResponse({"detail": str(exc)}, status=503)

    # Не возвращаем клиенту внутренние служебные поля шлюза.
    return JsonResponse({
        "id": result.get("id"),
        "status": result.get("status", "queued"),
    }, status=202)


@login_required
@require_GET
def agent_job(request: HttpRequest, job_id) -> JsonResponse:
    try:
        result = AIGatewayClient().get_job(str(job_id))
    except AIGatewayError as exc:
        return JsonResponse({"detail": str(exc)}, status=503)

    owner_id = result.get("requested_by")
    if owner_id is not None and str(owner_id) != str(request.user.pk) and not request.user.is_staff:
        return JsonResponse({"detail": "Доступ запрещён"}, status=403)

    return JsonResponse({
        "id": result.get("id", str(job_id)),
        "status": result.get("status", "unknown"),
        "result": result.get("result"),
        "error": result.get("error") if request.user.is_staff else None,
    })
