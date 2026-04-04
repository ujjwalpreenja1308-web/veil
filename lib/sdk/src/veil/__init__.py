"""Veil Python SDK — one-liner observability for AI agents.

Usage::

    import veil
    veil.init(api_key="vl_xxx")

    # Optional: name your agent so it shows up correctly in the dashboard
    veil.init(api_key="vl_xxx", agent_name="Sales Agent")

    # In serverless functions, call flush() before the handler returns
    # to guarantee telemetry is delivered before the process is frozen.
    veil.flush()

That's it.
"""

from __future__ import annotations

import atexit
import json
import sys
import urllib.request
import warnings
from datetime import datetime, timezone
from typing import Optional

__all__ = ["init", "flush"]

_initialized: bool = False
_session_id: Optional[str] = None
_api_key: Optional[str] = None
_endpoint: Optional[str] = None
_flushed: bool = False  # guard: flush sends session.end exactly once


def init(
    api_key: str,
    *,
    agent_name: str = "default",
    endpoint: str = "https://veil.dev",
) -> None:
    """Initialize the Veil SDK.

    Parameters
    ----------
    api_key:
        Your Veil API key (starts with ``vl_``).
    agent_name:
        Human-readable name for this agent. Shown in the Veil dashboard.
        Defaults to ``"default"``. Use a descriptive name like ``"Sales Agent"``.
    endpoint:
        Override the ingest URL. Leave unset unless self-hosting.
    """
    global _initialized, _session_id, _api_key, _endpoint  # noqa: PLW0603

    if _initialized:
        warnings.warn(
            "veil.init() already called. Ignoring duplicate.",
            stacklevel=2,
        )
        return

    if not api_key or not isinstance(api_key, str) or not api_key.startswith("vl_"):
        raise ValueError(
            "Invalid Veil API key — must start with 'vl_'. "
            "Get your key from https://veil.dev/dashboard/settings"
        )

    import uuid
    _session_id = str(uuid.uuid4())
    _api_key = api_key
    _endpoint = endpoint.rstrip("/")

    _start(
        api_key=api_key,
        agent_name=agent_name,
        endpoint=_endpoint,
        session_id=_session_id,
    )
    atexit.register(_shutdown)

    _initialized = True


def flush(timeout: float = 5.0) -> None:
    """Flush all pending telemetry and close the current session.

    Call this explicitly in serverless functions (AWS Lambda, Google Cloud
    Functions, Vercel Edge, etc.) before your handler returns, because the
    process may be frozen or killed before the ``atexit`` hook fires.

    It is safe to call ``flush()`` multiple times — only the first call sends
    the ``session.end`` event; subsequent calls are no-ops.

    Parameters
    ----------
    timeout:
        Seconds to wait for the HTTP request to complete. Default is 5.
    """
    global _flushed  # noqa: PLW0603

    if not _initialized:
        warnings.warn(
            "veil.flush() called before veil.init() — nothing to flush.",
            stacklevel=2,
        )
        return

    if _flushed:
        return

    _flushed = True

    # 1. Force OpenLIT's OTLP span exporter to flush buffered spans.
    _flush_openlit()

    # 2. Send session.end to close the session in Veil's pipeline.
    _send_session_end(timeout=timeout)


def _flush_openlit() -> None:
    """Best-effort flush of the OpenTelemetry SDK's span processors."""
    try:
        from opentelemetry import trace  # type: ignore[import-untyped]
        provider = trace.get_tracer_provider()
        # TracerProvider has force_flush(); ProxyTracerProvider does not.
        flush_fn = getattr(provider, "force_flush", None)
        if callable(flush_fn):
            flush_fn(timeout_millis=4_000)
    except Exception as exc:  # noqa: BLE001
        print(f"[veil] OpenTelemetry flush warning: {exc}", file=sys.stderr)


def _send_session_end(timeout: float = 5.0) -> None:
    """HTTP POST session.end to the Veil ingest endpoint."""
    if not _api_key or not _endpoint or not _session_id:
        return

    payload = json.dumps({
        "session_id": _session_id,
        "step": 0,
        "type": "session.end",
        "payload": {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }).encode("utf-8")

    req = urllib.request.Request(
        _endpoint + "/api/ingest",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": _api_key,
        },
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=timeout)
    except Exception as exc:  # noqa: BLE001
        print(f"[veil] session.end flush failed: {exc}", file=sys.stderr)


def _start(api_key: str, agent_name: str, endpoint: str, session_id: str) -> None:
    """Internal: configure and start OpenLIT with Veil as the OTLP backend."""
    try:
        import openlit  # type: ignore[import-untyped]
    except ImportError as exc:
        raise ImportError(
            "veil-sdk requires 'openlit'. Install it with: pip install veil-sdk"
        ) from exc

    otlp_endpoint = endpoint + "/api/ingest/otlp"

    openlit.init(
        otlp_endpoint=otlp_endpoint,
        otlp_headers=f"x-api-key={api_key}",
        environment="production",
        # application_name → gen_ai.system in OTLP spans → agent name in dashboard
        application_name=agent_name,
        # session_id groups all spans from this process into one session
        session_id=session_id,
        collect_gpu_stats=False,
    )


def _shutdown() -> None:
    """atexit handler — delegates to flush() so session.end fires exactly once."""
    flush()
