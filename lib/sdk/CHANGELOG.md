# Changelog

All notable changes to `veil-sdk` will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-03-30

### Added
- `veil.init(api_key, agent_name, endpoint)` — one-liner SDK initialisation
- Automatic LLM instrumentation via OpenLIT (OpenAI, Anthropic, LangChain, LlamaIndex, Cohere, Mistral, Google Gemini, AWS Bedrock)
- Session tracking: unique session ID generated per process, closed on exit
- Async OTLP telemetry forwarded to the Veil ingest pipeline
- Self-hosting support via the `endpoint` parameter
- `py.typed` marker for full type-checker support
