from __future__ import annotations

from typing import BinaryIO

import clamd
from django.conf import settings


def scan_stream(stream: BinaryIO) -> bool:
    """Возвращает True только при явном ответе ClamAV OK. Ошибка = fail closed."""
    host = getattr(settings, "CLAMAV_HOST", "clamav")
    port = int(getattr(settings, "CLAMAV_PORT", 3310))
    client = clamd.ClamdNetworkSocket(host=host, port=port, timeout=60)
    position = stream.tell()
    try:
        stream.seek(0)
        result = client.instream(stream)
    except Exception:
        return False
    finally:
        stream.seek(position)
    status = result.get("stream", (None, None))[0] if isinstance(result, dict) else None
    return status == "OK"
