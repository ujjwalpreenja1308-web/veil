"""
Directly injects failure events into Veil to test classification + Slack alert.
Run: python scripts/test_failure_trigger.py

No OpenAI key needed — sends raw events to the native ingest endpoint.
Tests: RAG failure, then cost anomaly
"""

import json
import uuid
import urllib.request
from datetime import datetime, timezone

VEIL_API_KEY = "vl_0b2a5f5aa872dcced7886b8b0ba68df2c96731fe8ac70bf0d4150daedcbcfc59"
ENDPOINT = "http://localhost:3000/api/ingest"

def send_event(session_id, step, event_type, payload):
    data = json.dumps({
        "session_id": session_id,
        "org_id": "",
        "step": step,
        "type": event_type,
        "payload": payload,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }).encode("utf-8")

    req = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={"Content-Type": "application/json", "x-api-key": VEIL_API_KEY},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())

def test_rag_failure():
    session_id = str(uuid.uuid4())
    print(f"\n🔴 Test 1: RAG Failure")
    print(f"   Session: {session_id[:8]}...")

    # Step 1 — normal LLM call
    send_event(session_id, 1, "openai.chat.completions", {
        "gen_ai.system": "openai",
        "gen_ai.request.model": "gpt-4.1-mini",
        "gen_ai.usage.prompt_tokens": 50,
        "gen_ai.usage.completion_tokens": 20,
        "gen_ai.usage.cost": 0.00002,
    })
    print("   ✓ Step 1: LLM call")

    # Step 2 — retrieval span with error (triggers RAG failure rule)
    send_event(session_id, 2, "retrieval", {
        "gen_ai.system": "openai",
        "gen_ai.error.message": "Vector store returned empty results — no documents matched query",
        "error": "empty_retrieval",
        "query": "quantum entanglement internal research",
        "results_count": 0,
    })
    print("   ✓ Step 2: Retrieval error injected")

    # Step 3 — session end triggers classification
    send_event(session_id, 9999, "session.end", {})
    print("   ✓ Step 3: session.end sent")
    print("   → Check dashboard/alerts + #viell-alerts Slack channel")
    print(f"   → http://localhost:3000/dashboard/sessions/{session_id}")

def test_cost_anomaly():
    session_id = str(uuid.uuid4())
    print(f"\n🟠 Test 2: Cost Anomaly")
    print(f"   Session: {session_id[:8]}...")

    # Multiple expensive LLM calls
    for step in range(1, 4):
        send_event(session_id, step, "openai.chat.completions", {
            "gen_ai.system": "openai",
            "gen_ai.request.model": "gpt-4",
            "gen_ai.usage.prompt_tokens": 10000,
            "gen_ai.usage.completion_tokens": 5000,
            "gen_ai.usage.cost": 0.45,  # $0.45 per call × 3 = $1.35 → triggers high threshold
        })
        print(f"   ✓ Step {step}: Expensive LLM call ($0.45)")

    send_event(session_id, 9999, "session.end", {})
    print("   ✓ session.end sent — total cost $1.35")
    print("   → Check dashboard/alerts + #viell-alerts Slack channel")
    print(f"   → http://localhost:3000/dashboard/sessions/{session_id}")

if __name__ == "__main__":
    print("🚀 Veil Failure Trigger Test")
    print("   Injecting failure events directly into ingest pipeline...\n")

    test_rag_failure()
    test_cost_anomaly()

    print("\n✅ Done — check Slack #viell-alerts and the dashboard Alerts page")
