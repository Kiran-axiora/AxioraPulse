from slowapi import Limiter
from slowapi.util import get_remote_address
from core import config

# We'll try to use Redis for rate limiting if available in production/docker
# slowapi can use a redis storage backend if we provide storage_uri
# but for now we keep it simple or we can add redis storage if REDIS_URL is present

storage_uri = config.REDIS_URL if config.REDIS_URL else "memory://"

limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)