"""Veil Python SDK — one-liner observability for AI agents.

Usage::

    import veil
    veil.init(api_key="vl_xxx")

That's it.
"""

from __future__ import annotations

import atexit
import warnings
from typing import Optional

__all__ = ["init"]

_initialized: bool = False
_session_id: Optional[str] = None


def init(api_key: str, *, endpoint: str = "https://veil.dev") -> None:
    """Initialize the Veil SDK.

    Parameters
    ----------
    api_key:
        Your Veil API key (starts with ``vl_``).
    endpoint:
        Override the ingest URL. Leave unset unless self-hosting.
    """
    global _initialized, _session_id  # noqa: PLW0603

    if _initialized:
        warnings.warn(
            "veil.init() already called. Ignoring duplicate.",
            stacklevel=2,
        )
        return

    if not api_key or not api_key.startswith("vl_"):
        raise ValueError(
            f"Invalid Veil API key — must start with 'vl_', got: '{api_key[:12]}...'"
        )

    import uuid
    _session_id = str(uuid.uuid4())

    _start(api_key=api_key, endpoint=endpoint, session_id=_session_id)
    atexit.register(_shutdown, api_key=api_key, endpoint=endpoint, session_id=_session_id)

    _initialized = True


def _start(api_key: str, endpoint: str, session_id: str) -> None:
    """Internal: configure and start OpenLIT with Veil as the OTLP backend."""
    try:
        import openlit  # type: ignore[import-untyped]
    except ImportError as exc:
        raise ImportError(
            "veil-sdk requires 'openlit'. Install it with: pip install veil-sdk"
        ) from exc

    otlp_endpoint = endpoint.rstrip("/") + "/api/ingest/otlp"

    openlit.init(
        otlp_endpoint=otlp_endpoint,
        otlp_headers=f"x-api-key={api_key}",
        environment="production",
        application_name=session_id,
        collect_gpu_stats=False,
    )


def _shutdown(api_key: str, endpoint: str, session_id: str) -> None:
    """Atexit: send a session.end event so the ingest pipeline closes the session."""
    try:
        import json
        import urllib.request
        from datetime import datetime, timezone

        payload = json.dumps({
            "session_id": session_id,
            "org_id": "",
            "step": 9999,
            "type": "session.end",
            "payload": {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }).encode("utf-8")

        req = urllib.request.Request(
            endpoint.rstrip("/") + "/api/ingest",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
            },
            method="POST",
        )
        urllib.request.urlopen(req, timeout=3)
    except Exception:  # noqa: BLE001
        pass  # never crash on shutdown
