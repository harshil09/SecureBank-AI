import time
import logging
from fastapi import Request

logger = logging.getLogger("latency")


async def latency_middleware(request: Request, call_next):
    start_time = time.perf_counter()

    response = await call_next(request)

    process_time = time.perf_counter() - start_time

    # 🔥 Add header (super useful for frontend debugging)
    response.headers["X-Process-Time"] = str(round(process_time, 4))

    # 🔥 Log structured data
    logger.info(
        f"{request.method} {request.url.path} | "
        f"Status: {response.status_code} | "
        f"Latency: {process_time:.4f}s"
    )

    return response