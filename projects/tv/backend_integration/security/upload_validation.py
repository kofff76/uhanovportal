from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Callable

from django.core.exceptions import ValidationError

try:
    import magic  # python-magic, системная libmagic обязательна в production
except ImportError:  # pragma: no cover
    magic = None


ALLOWLIST_PATH = Path(__file__).with_name("mime_allowlist.json")
SAFE_NAME_RE = re.compile(r"[^a-zA-Z0-9а-яА-ЯёЁ._ -]+")


@dataclass(frozen=True)
class UploadVerdict:
    safe_name: str
    extension: str
    detected_mime: str
    size: int


def _allowlist() -> dict:
    return json.loads(ALLOWLIST_PATH.read_text(encoding="utf-8"))


def _flatten_allowlist() -> dict[str, dict]:
    result: dict[str, dict] = {}
    for group in _allowlist().values():
        result.update(group)
    return result


def safe_filename(name: str) -> str:
    clean = SAFE_NAME_RE.sub("_", Path(name).name).strip(" .")
    if not clean or clean in {".", ".."}:
        raise ValidationError("Некорректное имя файла")
    return clean[:180]


def _read_head(stream: BinaryIO, length: int = 8192) -> bytes:
    position = stream.tell()
    head = stream.read(length)
    stream.seek(position)
    return head


def _signature_matches(extension: str, head: bytes) -> bool:
    # Сигнатуры используются вместе с libmagic, а не вместо неё.
    if extension in {".jpg", ".jpeg"}:
        return head.startswith(b"\xff\xd8\xff")
    if extension == ".png":
        return head.startswith(b"\x89PNG\r\n\x1a\n")
    if extension == ".webp":
        return len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP"
    if extension in {".mp4", ".mov", ".m4a"}:
        return len(head) >= 12 and head[4:8] == b"ftyp"
    if extension in {".mkv", ".webm"}:
        return head.startswith(b"\x1aE\xdf\xa3")
    if extension == ".mp3":
        return head.startswith(b"ID3") or (len(head) >= 2 and head[0] == 0xFF and head[1] & 0xE0 == 0xE0)
    if extension == ".wav":
        return len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WAVE"
    if extension in {".srt", ".vtt"}:
        if b"\x00" in head:
            return False
        try:
            text = head.decode("utf-8-sig")
        except UnicodeDecodeError:
            return False
        return extension == ".srt" or text.lstrip().startswith("WEBVTT")
    return False


def detect_mime(stream: BinaryIO) -> str:
    if magic is None:
        raise ValidationError("На сервере не установлены libmagic/python-magic; проверка загрузки остановлена")
    head = _read_head(stream, 262144)
    return str(magic.from_buffer(head, mime=True)).lower().strip()


def validate_upload(
    uploaded_file,
    *,
    declared_content_type: str | None = None,
    antivirus_scan: Callable[[BinaryIO], bool] | None = None,
) -> UploadVerdict:
    rules = _flatten_allowlist()
    filename = safe_filename(uploaded_file.name)
    extension = Path(filename).suffix.lower()
    rule = rules.get(extension)
    if not rule:
        raise ValidationError("Тип файла не разрешён")

    size = int(getattr(uploaded_file, "size", 0) or 0)
    if size <= 0 or size > int(rule["max_bytes"]):
        raise ValidationError("Файл пустой или превышает допустимый размер")

    detected_mime = detect_mime(uploaded_file)
    allowed_mimes = {item.lower() for item in rule["mime"]}
    if detected_mime not in allowed_mimes:
        raise ValidationError("Фактический MIME не соответствует разрешённому типу")

    if declared_content_type and declared_content_type.lower() not in allowed_mimes:
        raise ValidationError("Заявленный MIME не соответствует расширению")

    head = _read_head(uploaded_file)
    if not _signature_matches(extension, head):
        raise ValidationError("Сигнатура файла не соответствует расширению")

    if antivirus_scan is None:
        raise ValidationError("Антивирусная проверка не настроена; файл оставлен в карантине")
    if not antivirus_scan(uploaded_file):
        raise ValidationError("Антивирусная проверка не пройдена")

    uploaded_file.seek(0)
    return UploadVerdict(filename, extension, detected_mime, size)
