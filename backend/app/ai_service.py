import json
import logging
import time

import httpx

from app.core.config import get_settings

logger = logging.getLogger("app.ai")


def _fallback_response(title: str, resource_type: str) -> tuple[str, list[str], int]:
    description = (
        f"Material de {resource_type.lower()} sobre '{title}', com foco em aprendizagem prática "
        "e revisão objetiva para estudantes."
    )
    tags = [resource_type.lower(), "educacao", "estudo"]
    token_usage = max(80, len(title.split()) * 10)
    return description, tags, token_usage


def generate_description_and_tags(
    title: str, resource_type: str
) -> tuple[str, list[str]]:
    settings = get_settings()
    started_at = time.perf_counter()

    if settings.ai_mode == "mock" or not settings.openai_api_key:
        time.sleep(1)
        description, tags, token_usage = _fallback_response(title, resource_type)
        latency = round(time.perf_counter() - started_at, 3)
        logger.info(
            "AI Request",
            extra={
                "extra_fields": {
                    "title": title,
                    "token_usage": token_usage,
                    "latency_seconds": latency,
                    "mode": "mock",
                }
            },
        )
        return description, tags

    system_prompt = (
        "Você é um Assistente Pedagógico. Gere UMA descrição curta e útil para alunos "
        "e EXATAMENTE 3 tags. Responda estritamente em JSON com o formato: "
        '{"description":"texto","tags":["tag1","tag2","tag3"]}. '
        "Sem texto fora do JSON."
    )
    user_prompt = f"Título: {title}\nTipo: {resource_type}"

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                f"{settings.openai_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openai_model,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "response_format": {"type": "json_object"},
                },
            )
        response.raise_for_status()
        payload = response.json()
        content = payload["choices"][0]["message"]["content"]
        output = json.loads(content)

        description = str(output["description"]).strip()
        raw_tags = output["tags"] if isinstance(output["tags"], list) else []
        tags = [str(tag).strip() for tag in raw_tags if str(tag).strip()][:3]
        if len(tags) < 3:
            _, fallback_tags, _ = _fallback_response(title, resource_type)
            tags = (tags + fallback_tags)[:3]

        token_usage = int(payload.get("usage", {}).get("total_tokens", 0))
        latency = round(time.perf_counter() - started_at, 3)
        logger.info(
            "AI Request",
            extra={
                "extra_fields": {
                    "title": title,
                    "token_usage": token_usage,
                    "latency_seconds": latency,
                    "mode": "live",
                }
            },
        )
        return description, tags
    except Exception as exc:
        latency = round(time.perf_counter() - started_at, 3)
        logger.error(
            "AI Request Failed",
            extra={
                "extra_fields": {
                    "title": title,
                    "latency_seconds": latency,
                    "mode": "live",
                    "error": str(exc),
                }
            },
        )
        description, tags, _ = _fallback_response(title, resource_type)
        return description, tags
