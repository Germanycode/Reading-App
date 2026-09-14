from pydantic import BaseModel


class MusicTrackRead(BaseModel):
    id: str
    title: str
    filename: str
    url: str
