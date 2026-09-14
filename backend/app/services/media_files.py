from pathlib import Path
from urllib.parse import quote

from app.config import get_settings

SUPPORTED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"}


def get_music_dir() -> Path:
    return Path(get_settings().assets_musics_dir).resolve()


def get_icons_dir() -> Path:
    return Path(get_settings().assets_icons_dir).resolve()


def is_supported_audio_file(file_path: Path) -> bool:
    return file_path.is_file() and file_path.suffix.lower() in SUPPORTED_AUDIO_EXTENSIONS


def format_music_title(filename: str) -> str:
    stem = Path(filename).stem
    words = stem.replace("_", " ").replace("-", " ").split()
    if words and words[0].lower() == "the" and len(words) > 1 and words[1].lower() == "mountain":
        words = words[2:]
    return " ".join(word.capitalize() for word in words) or stem


def list_music_tracks() -> list[dict[str, str]]:
    music_dir = get_music_dir()
    if not music_dir.exists():
        return []

    tracks: list[dict[str, str]] = []
    for music_path in sorted(music_dir.iterdir(), key=lambda path: path.name.lower()):
        if not is_supported_audio_file(music_path):
            continue

        filename = music_path.name
        tracks.append(
            {
                "id": filename,
                "title": format_music_title(filename),
                "filename": filename,
                "url": f"/api/media/music/{quote(filename)}",
            }
        )

    return tracks


def resolve_music_file(filename: str) -> Path | None:
    music_dir = get_music_dir()
    file_path = (music_dir / Path(filename).name).resolve()
    if not file_path.is_relative_to(music_dir) or not is_supported_audio_file(file_path):
        return None
    return file_path


def resolve_icon_file(filename: str) -> Path | None:
    icons_dir = get_icons_dir()
    file_path = (icons_dir / Path(filename).name).resolve()
    if not file_path.is_relative_to(icons_dir) or not file_path.is_file():
        return None
    return file_path
