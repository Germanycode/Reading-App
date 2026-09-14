"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMediaUrl, listMusicTracks } from "@/lib/api";
import { cn } from "@/lib/utils";

const HEADPHONES_ICON_URL = getMediaUrl("/media/icons/headphones.png");

export function BackgroundMusicPlayer() {
  const playerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const suppressToggleRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [playError, setPlayError] = useState<string | null>(null);

  const { data: tracks = [], isLoading, isError } = useQuery({
    queryKey: ["music-tracks"],
    queryFn: listMusicTracks,
    staleTime: 5 * 60 * 1000
  });

  const currentTrack = tracks[currentTrackIndex];
  const currentTrackUrl = useMemo(() => (currentTrack ? getMediaUrl(currentTrack.url) : ""), [currentTrack]);
  const volumePercent = Math.round(volume * 100);

  const playSelectedTrack = useCallback(
    async (trackIndex = currentTrackIndex) => {
      if (!tracks[trackIndex] || !audioRef.current) {
        return;
      }

      setCurrentTrackIndex(trackIndex);
      setPlayError(null);

      try {
        const selectedTrackUrl = getMediaUrl(tracks[trackIndex].url);
        if (audioRef.current.src !== selectedTrackUrl) {
          audioRef.current.src = selectedTrackUrl;
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
        setPlayError("Unable to start music. Try again after the page finishes loading.");
      }
    },
    [currentTrackIndex, tracks]
  );

  const playCurrentTrack = useCallback(() => {
    if (tracks.length === 0) {
      setPlayError("Music is still loading. Click play when the track list appears.");
      return;
    }

    void playSelectedTrack(currentTrackIndex);
  }, [currentTrackIndex, playSelectedTrack, tracks.length]);

  useEffect(() => {
    if (currentTrackIndex >= tracks.length) {
      setCurrentTrackIndex(0);
    }
  }, [currentTrackIndex, tracks.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current || !isPlaying || !currentTrackUrl) {
      return;
    }

    void audioRef.current.play().catch(() => {
      setIsPlaying(false);
      setPlayError("Click play to start background music.");
    });
  }, [currentTrackUrl, isPlaying]);

  useEffect(() => {
    window.addEventListener("reading-app:start-background-music", playCurrentTrack);
    return () => window.removeEventListener("reading-app:start-background-music", playCurrentTrack);
  }, [playCurrentTrack]);

  function pauseMusic() {
    audioRef.current?.pause();
    setIsPlaying(false);
  }

  function toggleMusic() {
    if (isPlaying) {
      pauseMusic();
      return;
    }

    void playSelectedTrack();
  }

  function playNextTrack() {
    if (tracks.length < 2) {
      return;
    }

    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    void playSelectedTrack(nextIndex);
  }

  function handleVolumePointer(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const pointerX = event.clientX - centerX;
    const pointerY = event.clientY - centerY;
    const distanceFromCenter = Math.hypot(pointerX, pointerY);
    if (distanceFromCenter < 24) {
      suppressToggleRef.current = false;
      return;
    }

    suppressToggleRef.current = true;
    event.preventDefault();
    const angle = Math.atan2(pointerY, pointerX);
    const normalized = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    const nextVolume = Math.min(1, Math.max(0, normalized / (Math.PI * 2)));
    setVolume(Number(nextVolume.toFixed(2)));
  }

  return (
    <div
      ref={playerRef}
      className="fixed bottom-20 right-4 z-30 md:bottom-6 md:right-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsHovered(false);
        }
      }}
    >
      <audio ref={audioRef} src={currentTrackUrl} loop preload="metadata" />

      <div
        className={cn(
          "absolute bottom-16 right-0 w-[min(calc(100vw-2rem),22rem)] rounded-md border border-border bg-background/95 p-3 shadow-2xl backdrop-blur transition duration-150",
          isHovered ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Background Music</p>
              <p className="truncate text-xs text-muted-foreground">
                {isLoading ? "Loading tracks..." : currentTrack ? currentTrack.title : "No music found"}
              </p>
            </div>
            <span className={cn("rounded-full px-2 py-1 text-xs", isPlaying ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
              {isPlaying ? "On" : "Off"}
            </span>
          </div>

          {playError ? <p className="mt-2 text-xs text-amber-200">{playError}</p> : null}
          {isError ? <p className="mt-2 text-xs text-red-200">Unable to load music tracks.</p> : null}

          {tracks.length > 0 ? (
            <div className="mt-3 max-h-52 space-y-1 overflow-y-auto pr-1">
              {tracks.map((track, index) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => void playSelectedTrack(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition hover:bg-muted",
                    index === currentTrackIndex && "bg-muted text-foreground"
                  )}
                >
                  <span className="truncate">{track.title}</span>
                  {index === currentTrackIndex && isPlaying ? <span className="text-xs text-primary">Playing</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

      <button
        type="button"
        onClick={(event) => {
          if (suppressToggleRef.current) {
            suppressToggleRef.current = false;
            return;
          }
          if (event.shiftKey || event.altKey) {
            playNextTrack();
            return;
          }
          toggleMusic();
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || event.shiftKey || event.altKey) {
            return;
          }
          handleVolumePointer(event);
        }}
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background/95 shadow-2xl ring-1 ring-white/10 transition hover:border-primary/70",
          isPlaying && "border-primary bg-primary/15 shadow-primary/20"
        )}
        style={{
          background: `conic-gradient(hsl(var(--primary)) ${volumePercent}%, hsl(var(--muted)) ${volumePercent}% 100%)`
        }}
        aria-label={isPlaying ? "Turn off background music" : "Turn on background music"}
        title={`${currentTrack ? currentTrack.title : "Background music"} - volume ${volumePercent}%`}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full blur-md transition",
            isPlaying ? "bg-primary/25 opacity-100" : "bg-primary/10 opacity-40"
          )}
        />
        <span className="absolute inset-1.5 rounded-full bg-background/95" />
        <img src={HEADPHONES_ICON_URL} alt="" width={32} height={32} className="relative h-8 w-8" />
        <span className="absolute -bottom-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
          {volumePercent}
        </span>
      </button>
    </div>
  );
}
