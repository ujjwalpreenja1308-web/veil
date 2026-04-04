import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends

from app.auth import verify_api_key
from app.models import AnalyzeRequest
from app.pipeline.runner import run_pipeline

router = APIRouter()


@router.post("/analyze", status_code=202)
async def analyze(
    req: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    _: None = Depends(verify_api_key),
) -> dict:
    """Kick off the inspector pipeline as a background task.

    Returns 202 immediately. FastAPI writes the final result directly to DB.
    The caller polls /api/inspector/runs/{run_id} for status.
    """
    background_tasks.add_task(run_pipeline, req)
    return {"run_id": req.run_id, "status": "running"}
