from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.schemas.media import MusicTrackRead
from app.services.media_files import list_music_tracks, resolve_icon_file, resolve_music_file

router = APIRouter()


@router.get("/music", response_model=list[MusicTrackRead])
async def get_music_tracks() -> list[dict[str, str]]:
    return list_music_tracks()


@router.get("/music/{filename}")
async def get_music_file(filename: str) -> FileResponse:
    file_path = resolve_music_file(filename)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Music file not found.")

    return FileResponse(file_path, media_type="audio/mpeg", filename=file_path.name)


@router.get("/icons/{filename}")
async def get_icon_file(filename: str) -> FileResponse:
    file_path = resolve_icon_file(filename)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="Icon file not found.")

    return FileResponse(file_path, media_type="image/png", filename=file_path.name)
