from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin

import httpx
from django.conf import settings


class AIGatewayError(RuntimeError):
    """Безопасная ошибка шлюза без публикации токенов и внутреннего ответа целиком."""


@dataclass(frozen=True)
class GatewayConfig:
    base_url: str
    token: str
    jobs_path: str
    timeout_seconds: float

    @classmethod
    def from_settings(cls) -> "GatewayConfig":
        base_url = str(getattr(settings, "AI_GATEWAY_URL", "")).strip()
        token = str(getattr(settings, "AI_GATEWAY_TOKEN", "")).strip()
        jobs_path = str(getattr(settings, "AI_GATEWAY_JOBS_PATH", "/v1/admin/jobs")).strip()
        timeout_seconds = float(getattr(settings, "AI_GATEWAY_TIMEOUT_SECONDS", 120))
        if not base_url or not token:
            raise AIGatewayError("AI Gateway не настроен")
        return cls(base_url.rstrip("/") + "/", token, jobs_path.lstrip("/"), timeout_seconds)


class AIGatewayClient:
    def __init__(self, config: GatewayConfig | None = None) -> None:
        self.config = config or GatewayConfig.from_settings()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.config.token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _url(self, suffix: str = "") -> str:
        base = urljoin(self.config.base_url, self.config.jobs_path)
        return f"{base.rstrip('/')}/{suffix.lstrip('/')}" if suffix else base

    def create_job(self, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            response = httpx.post(
                self._url(),
                headers=self._headers(),
                json=payload,
                timeout=self.config.timeout_seconds,
            )
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise AIGatewayError("AI Gateway временно недоступен") from exc
        if not isinstance(data, dict) or not data.get("id"):
            raise AIGatewayError("AI Gateway вернул некорректный ответ")
        return data

    def get_job(self, job_id: str) -> dict[str, Any]:
        try:
            response = httpx.get(
                self._url(job_id),
                headers=self._headers(),
                timeout=min(self.config.timeout_seconds, 30),
            )
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise AIGatewayError("Не удалось получить состояние AI-задачи") from exc
        if not isinstance(data, dict):
            raise AIGatewayError("AI Gateway вернул некорректный ответ")
        return data
