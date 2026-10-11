"""Configuration and path management for job-application-agent."""
from pathlib import Path
import tomllib
from typing import Any, Dict

# Base project directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

CONFIG_DIR = PROJECT_ROOT / "config"
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR  # Kept as alias for data directory
STORAGE_DIR = PROJECT_ROOT / "storage"
KNOWLEDGE_DIR = PROJECT_ROOT / "knowledge"
PROMPTS_DIR = PROJECT_ROOT / "prompts"
DOCS_DIR = PROJECT_ROOT / "docs"

SETTINGS_FILE = CONFIG_DIR / "settings.toml"
CANDIDATES_FILE = CONFIG_DIR / "candidates.toml"
SCHEMA_FILE = STORAGE_DIR / "schema.sql"


def load_toml(path: Path) -> Dict[str, Any]:
    """Loads a TOML file safely."""
    if not path.exists():
        return {}
    with open(path, "rb") as f:
        return tomllib.load(f)


def get_settings() -> Dict[str, Any]:
    """Returns application settings."""
    return load_toml(SETTINGS_FILE)


def get_candidates() -> Dict[str, Dict[str, Any]]:
    """Returns candidate dictionary keyed by candidate id."""
    data = load_toml(CANDIDATES_FILE)
    return data.get("candidates", {})


def get_db_path() -> Path:
    """Returns absolute path to SQLite database."""
    settings = get_settings()
    rel_path = settings.get("database", {}).get("path", "storage/career.db")
    return PROJECT_ROOT / rel_path
