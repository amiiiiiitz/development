from datetime import datetime, timezone
import math
import secrets
from typing import Tuple


def generate_reference(prefix: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = secrets.token_hex(3).upper()
    return f"{prefix}-{stamp}-{suffix}"


def calculate_pagination(total: int, page: int, page_size: int) -> Tuple[int, int]:
    safe_page = max(1, page)
    safe_size = max(1, min(page_size, 100))
    total_pages = max(1, math.ceil(total / safe_size)) if total > 0 else 1
    return safe_page, total_pages
