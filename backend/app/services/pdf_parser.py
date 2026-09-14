from dataclasses import dataclass
from pathlib import Path
import os
import tempfile

import fitz


@dataclass(frozen=True)
class PDFPageText:
    page_number: int
    text: str
    char_count: int
    word_count: int


@dataclass(frozen=True)
class PDFTextExtraction:
    title: str | None
    author: str | None
    page_count: int
    pages: list[PDFPageText]
    total_char_count: int
    total_word_count: int


class PDFParseError(Exception):
    pass


def extract_pdf_metadata(path: Path) -> dict[str, str | int | None]:
    try:
        with fitz.open(path) as document:
            metadata = document.metadata
            return {
                "title": clean_metadata_value(metadata.get("title")) or path.stem,
                "author": clean_metadata_value(metadata.get("author")),
                "page_count": document.page_count,
            }
    except Exception:
        return {
            "title": path.stem,
            "author": None,
            "page_count": None,
        }


def update_pdf_title_metadata(path: Path, title: str) -> None:
    clean_title = title.strip()
    if not clean_title:
        raise PDFParseError("Book title cannot be empty.")

    try:
        with fitz.open(path) as document:
            if document.needs_pass:
                raise PDFParseError("Password-protected PDFs cannot be updated.")

            metadata = {key: value or "" for key, value in document.metadata.items()}
            metadata["title"] = clean_title
            document.set_metadata(metadata)

            try:
                document.saveIncr()
                return
            except Exception:
                temp_path = create_temp_pdf_path(path)
                document.save(temp_path, garbage=4, deflate=True)
    except PDFParseError:
        raise
    except Exception as exc:
        raise PDFParseError("Unable to update PDF metadata.") from exc

    try:
        os.replace(temp_path, path)
    except OSError as exc:
        Path(temp_path).unlink(missing_ok=True)
        raise PDFParseError("Unable to replace the PDF after updating metadata.") from exc


def extract_pdf_text(path: Path, page_from: int | None = None, page_to: int | None = None) -> PDFTextExtraction:
    try:
        with fitz.open(path) as document:
            if document.needs_pass:
                raise PDFParseError("Password-protected PDFs cannot be extracted.")

            page_count = document.page_count
            start_page, end_page = normalize_page_range(page_count, page_from, page_to)
            metadata = document.metadata
            pages: list[PDFPageText] = []

            for page_index in range(start_page - 1, end_page):
                page = document.load_page(page_index)
                text = normalize_extracted_text(page.get_text("text", sort=True))
                pages.append(
                    PDFPageText(
                        page_number=page_index + 1,
                        text=text,
                        char_count=len(text),
                        word_count=count_words(text),
                    )
                )

            return PDFTextExtraction(
                title=clean_metadata_value(metadata.get("title")),
                author=clean_metadata_value(metadata.get("author")),
                page_count=page_count,
                pages=pages,
                total_char_count=sum(page.char_count for page in pages),
                total_word_count=sum(page.word_count for page in pages),
            )
    except PDFParseError:
        raise
    except Exception as exc:
        raise PDFParseError("Unable to extract text from the PDF.") from exc


def normalize_page_range(page_count: int, page_from: int | None, page_to: int | None) -> tuple[int, int]:
    if page_count < 1:
        raise PDFParseError("PDF has no readable pages.")

    start_page = page_from or 1
    end_page = page_to or page_count

    if start_page < 1:
        raise PDFParseError("page_from must be greater than or equal to 1.")
    if end_page < 1:
        raise PDFParseError("page_to must be greater than or equal to 1.")
    if start_page > end_page:
        raise PDFParseError("page_from must be less than or equal to page_to.")
    if start_page > page_count:
        raise PDFParseError(f"page_from cannot be greater than the PDF page count ({page_count}).")

    return start_page, min(end_page, page_count)


def normalize_extracted_text(text: str) -> str:
    lines = [line.strip() for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    return "\n".join(line for line in lines if line).strip()


def count_words(text: str) -> int:
    return len(text.split())


def clean_metadata_value(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()
    if not cleaned or cleaned.lower() in {"untitled", "unknown"}:
        return None
    return cleaned


def create_temp_pdf_path(path: Path) -> str:
    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        dir=path.parent,
        prefix=f".{path.stem}-",
        suffix=".pdf",
    )
    temp_name = temp_file.name
    temp_file.close()
    return temp_name
