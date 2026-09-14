from pathlib import Path

from app.config import get_settings


def resolve_book_file_path(stored_path: str) -> Path | None:
    settings = get_settings()

    if stored_path.startswith("uploads/"):
        upload_dir = Path(settings.upload_dir).resolve()
        file_path = (upload_dir / stored_path.removeprefix("uploads/")).resolve()
        return file_path if file_path.is_relative_to(upload_dir) else None

    books_dir = Path(settings.assets_books_dir).resolve()
    file_path = (books_dir / stored_path).resolve()
    return file_path if file_path.is_relative_to(books_dir) else None


def is_pdf_file(file_path: Path) -> bool:
    try:
        with file_path.open("rb") as file:
            return file.read(5) == b"%PDF-"
    except OSError:
        return False
