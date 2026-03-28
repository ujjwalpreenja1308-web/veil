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
