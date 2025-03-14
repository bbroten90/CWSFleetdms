import os
from typing import List, Optional

try:
    # Try importing from pydantic-settings (for Pydantic v2)
    from pydantic_settings import BaseSettings
    from pydantic import Field
except ImportError:
    # Fall back to old import path (for Pydantic v1)
    from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Samsara
    SAMSARA_API_KEY: Optional[str] = Field(None, env="SAMSARA_API_KEY")
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]  # Restrict this in production
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Create settings instance
settings = Settings()
