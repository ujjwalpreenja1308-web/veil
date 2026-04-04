# Veil Python SDK

One-liner observability for AI agents.

## Installation

```bash
pip install veil-sdk
```

## Quickstart

```python
import veil

veil.init(api_key="vl_xxx")
```

That's it. Add this before your agent runs. Veil automatically instruments
OpenAI, Anthropic, LangChain, LlamaIndex, and other popular LLM libraries,
and sends all telemetry to your Veil dashboard.

## Serverless functions (Lambda, Cloud Functions, Vercel, etc.)

In long-running processes (servers, scripts, notebooks), Veil automatically
sends all telemetry when the process exits. No extra code needed.

In **serverless functions**, the process doesn't exit cleanly — it gets frozen
or killed by the platform the moment your handler returns. Any telemetry still
in the buffer is silently dropped, and your session never closes in the
dashboard.

Call `veil.flush()` at the end of your handler to force delivery before the
freeze:

```python
import veil

veil.init(api_key="vl_xxx", agent_name="My Lambda")

def handler(event, context):
    # ... your agent logic ...

    veil.flush()  # send everything before Lambda freezes
    return result
```

`flush()` does two things in order:
1. Forces the OpenTelemetry exporter to drain any buffered spans (LLM call data)
2. Sends a `session.end` event so Veil closes and classifies the session

It is safe to call multiple times — only the first call does anything.

**Environments where you must call `flush()`:**

| Platform | Why |
|---|---|
| AWS Lambda | Handler returns → process frozen immediately |
| Google Cloud Functions | Same — process suspended after return |
| Vercel / Netlify Functions | Execution context torn down after response |
| Azure Functions | Consumption plan freezes after invocation |

**Environments where `flush()` is optional** (but harmless):

- Long-running servers (FastAPI, Flask, Django)
- CLI scripts
- Jupyter notebooks
- Docker containers

## How it works

- Telemetry is collected and sent asynchronously — zero impact on your agent's performance.
- Sessions are automatically tracked from the first LLM call through to process exit.
- Failures are detected and classified server-side — no configuration required.
- Every failure triggers an alert in your Veil dashboard and via email.

## Supported Libraries

Veil auto-instruments all major LLM frameworks including:

- OpenAI
- Anthropic
- LangChain
- LlamaIndex
- Cohere
- Mistral
- Google Gemini
- AWS Bedrock
- And more

## Requirements

- Python >= 3.9

## Your API Key

Find your API key in the [Veil Dashboard](https://veil.dev/dashboard/settings) under Settings.
Keys follow the format `vl_` followed by 64 hex characters.

## Self-hosting

If you are running Veil on your own infrastructure, pass the `endpoint` parameter:

```python
veil.init(api_key="vl_xxx", endpoint="https://your-veil-instance.com")
```
