import io
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def read_valid_image(upload: UploadFile) -> tuple[bytes, Image.Image]:
    """Read an uploaded image once, reject invalid content, and return RGB pixels."""

    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or WEBP image.")

    contents = await upload.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="The image exceeds the 8 MB upload limit.")

    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=415, detail="The uploaded file is not a readable image.") from exc
    return contents, image


def resolve_path(value: str, base_dir: Path) -> Path:
    """Resolve configuration paths relative to the backend directory."""

    path = Path(value)
    return path if path.is_absolute() else (base_dir / path).resolve()
