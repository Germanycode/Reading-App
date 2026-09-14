from collections import defaultdict, deque
from time import monotonic

from fastapi import HTTPException, Request

WINDOW_SECONDS = 60
MAX_REQUESTS = 20

request_times: dict[str, deque[float]] = defaultdict(deque)


async def limit_ai_requests(request: Request) -> None:
    client_host = request.client.host if request.client else "unknown"
    route_key = f"{client_host}:{request.url.path}"
    now = monotonic()
    timestamps = request_times[route_key]

    while timestamps and now - timestamps[0] > WINDOW_SECONDS:
        timestamps.popleft()

    if len(timestamps) >= MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Too many AI requests. Please wait a moment and try again.")

    timestamps.append(now)
