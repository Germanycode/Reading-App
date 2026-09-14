from pathlib import Path
import re
import wave

from google import genai
from google.genai import types


class TTSServiceUnavailable(Exception):
    pass


MAX_TTS_CHARS = 28000
SUPPORTED_GEMINI_VOICES = {
    "Zephyr",
    "Puck",
    "Charon",
    "Kore",
    "Fenrir",
    "Leda",
    "Orus",
    "Aoede",
    "Callirrhoe",
    "Autonoe",
    "Enceladus",
    "Iapetus",
    "Umbriel",
    "Algieba",
    "Despina",
    "Erinome",
    "Algenib",
    "Rasalgethi",
    "Laomedeia",
    "Achernar",
    "Alnilam",
    "Schedar",
    "Gacrux",
    "Pulcherrima",
    "Achird",
    "Zubenelgenubi",
    "Vindemiatrix",
    "Sadachbia",
    "Sadaltager",
    "Sulafat",
}

TONE_INSTRUCTIONS = {
    "calm": "Read in a calm, steady audiobook narration style with clear pacing.",
    "focused": "Read with a focused, precise study-guide tone. Keep the delivery crisp and attentive.",
    "warm": "Read warmly and gently, like an encouraging personal tutor.",
    "dramatic": "Read with moderate dramatic emphasis while keeping the text accurate and easy to follow.",
    "energetic": "Read with lively energy and a faster, upbeat delivery without sounding rushed.",
}


def normalize_voice_name(voice_name: str) -> str:
    normalized = voice_name.strip()
    if normalized not in SUPPORTED_GEMINI_VOICES:
        raise TTSServiceUnavailable(f"Unsupported Gemini voice: {voice_name}")
    return normalized


def build_tts_prompt(text: str, tone: str, speaking_style: str | None = None) -> str:
    clean_text = re.sub(r"\s+", " ", text).strip()
    if not clean_text:
        raise TTSServiceUnavailable("No text was provided for speech synthesis.")
    if len(clean_text) > MAX_TTS_CHARS:
        clean_text = clean_text[:MAX_TTS_CHARS].rsplit(" ", 1)[0].strip()

    tone_instruction = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS["calm"])
    if speaking_style:
        tone_instruction = f"{tone_instruction} Additional direction: {speaking_style.strip()}"

    return f"{tone_instruction}\n\nRead this book excerpt exactly:\n\n{clean_text}"


def synthesize_gemini_speech_bytes(
    text: str,
    gemini_api_key: str,
    model_name: str,
    voice_name: str,
    tone: str,
    speaking_style: str | None = None,
) -> bytes:
    if not gemini_api_key:
        raise TTSServiceUnavailable("GEMINI_API_KEY is required to generate audiobook audio.")

    voice = normalize_voice_name(voice_name)
    prompt = build_tts_prompt(text, tone=tone, speaking_style=speaking_style)
    client = genai.Client(api_key=gemini_api_key)

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice)
                    )
                ),
            ),
        )
        data = response.candidates[0].content.parts[0].inline_data.data
    except Exception as exc:
        raise TTSServiceUnavailable(f"Unable to generate audiobook audio: {exc}") from exc

    if not data:
        raise TTSServiceUnavailable("Gemini returned empty audiobook audio.")
    return data


def write_pcm_as_wav(file_path: Path, pcm_data: bytes, channels: int = 1, rate: int = 24000, sample_width: int = 2) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(file_path), "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(rate)
        wav_file.writeframes(pcm_data)
