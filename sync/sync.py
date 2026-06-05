import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

PINTEREST_URL = "https://www.pinterest.com/murad980"
ARCHIVE_DB = Path.home() / ".pinterest-archive.db"
TMP_DIR = Path("/tmp/pinterest_new")
REPO_ROOT = Path(__file__).parent.parent
PINS_JSON = REPO_ROOT / "web" / "public" / "pins.json"


def configure_cloudinary() -> None:
    cloudinary.config(cloudinary_url=os.environ["CLOUDINARY_URL"])


def upload_to_cloudinary(filepath: Path) -> str:
    result = cloudinary.uploader.upload(
        str(filepath),
        folder="mypinmoney",
        resource_type="image",
    )
    return result["secure_url"]


def make_pin_id(source_url: str) -> str:
    return hashlib.md5(source_url.encode()).hexdigest()[:12]


def load_pins(pins_json: Path) -> list:
    if pins_json.exists():
        return json.loads(pins_json.read_text())
    return []


def prepend_pin(pins_json: Path, pin: dict) -> None:
    pins = load_pins(pins_json)
    existing_ids = {p["id"] for p in pins}
    if pin["id"] not in existing_ids:
        pins.insert(0, pin)
        pins_json.write_text(json.dumps(pins, indent=2))


def run_gallery_dl() -> list[Path]:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "gallery-dl",
            "--download-archive", str(ARCHIVE_DB),
            "--dest", str(TMP_DIR),
            PINTEREST_URL,
        ],
        check=True,
    )
    extensions = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    files: list[Path] = []
    for ext in extensions:
        files.extend(TMP_DIR.rglob(ext))
    return files


def git_push(repo_root: Path) -> None:
    subprocess.run(["git", "add", "web/public/pins.json"], cwd=repo_root, check=True)
    subprocess.run(
        ["git", "commit", "-m", "chore: sync new pins [skip ci]"],
        cwd=repo_root,
        check=True,
    )
    subprocess.run(["git", "push"], cwd=repo_root, check=True)


def sync() -> None:
    configure_cloudinary()
    new_files = run_gallery_dl()
    if not new_files:
        print("No new pins.")
        return

    for filepath in new_files:
        cloudinary_url = upload_to_cloudinary(filepath)
        pin = {
            "id": make_pin_id(cloudinary_url),
            "source_url": filepath.name,
            "cloudinary_url": cloudinary_url,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        prepend_pin(PINS_JSON, pin)
        filepath.unlink(missing_ok=True)

    git_push(REPO_ROOT)
    print(f"Synced {len(new_files)} new pins.")


if __name__ == "__main__":
    sync()
