import hashlib
from typing import Optional
from fastapi import Request, Response
from fastapi_cache import FastAPICache

def user_aware_key_builder(
    func,
    namespace: Optional[str] = "",
    request: Optional[Request] = None,
    response: Optional[Response] = None,
    args: Optional[tuple] = None,
    kwargs: Optional[dict] = None,
):
    """
    Custom key builder that:
    1. Includes user_id if current_user is present in kwargs.
    2. Excludes non-serializable objects like 'db' (SQLAlchemy Session) and 'request'.
    3. Includes function name and all other kwargs.
    """
    from db.models import UserProfile

    prefix = FastAPICache.get_prefix()
    cache_key = f"{prefix}:{namespace}:{func.__module__}:{func.__name__}"

    # Extract user info
    user = kwargs.get("current_user")
    user_id = "anonymous"
    if isinstance(user, UserProfile):
        user_id = str(user.id)

    # Filter kwargs to only include serializable/relevant parts
    # Exclude 'db', 'request', 'current_user' (since we handled it)
    exclude = {"db", "request", "current_user"}
    filtered_kwargs = {k: v for k, v in kwargs.items() if k not in exclude}

    # Sort and hash the filtered kwargs
    ordered_kwargs = sorted(filtered_kwargs.items())
    kwargs_str = str(ordered_kwargs)

    # Build final key
    key = f"{cache_key}:{user_id}:{kwargs_str}"
    return hashlib.md5(key.encode()).hexdigest()
