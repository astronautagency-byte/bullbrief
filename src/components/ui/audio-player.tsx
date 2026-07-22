"use client";

import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/types";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  audioUrl: string | null;
  title: string;
  duration: number | null;
  className?: string;
}

export function AudioPlayer({
  audioUrl,
  title,
  duration,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [ready, setReady] = useState(false);

  const speeds = [0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isPlaying, audioUrl]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + seconds));
  }, []);

  const cycleSpeed = () => {
    const idx = speeds.indexOf(playbackRate);
    setPlaybackRate(speeds[(idx + 1) % speeds.length]);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * totalDuration;
  };

  if (!audioUrl) {
    return (
      <div className={cn("bg-surface-container-highest p-3 rounded-lg border border-outline-variant opacity-50", className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <Play className="w-4 h-4 text-on-surface-variant/40" />
          </div>
          <p className="text-sm text-on-surface-variant truncate">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-surface-container-highest p-3 rounded-lg border border-outline-variant", className)}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setTotalDuration(audioRef.current.duration);
            setReady(true);
          }
        }}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 hover:bg-primary-fixed transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-on-surface truncate">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-on-surface-variant font-mono w-10 text-right">
              {formatDuration(Math.round(currentTime))}
            </span>
            <div
              className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden cursor-pointer group"
              onClick={seekTo}
            >
              <div
                className="h-full bg-primary rounded-full transition-[width] duration-100 group-hover:bg-primary-fixed"
                style={{ width: `${totalDuration ? (currentTime / totalDuration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-on-surface-variant font-mono w-10">
              {formatDuration(Math.round(totalDuration))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => seek(-15)}
            className="p-1.5 text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Rewind 15 seconds"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => seek(30)}
            className="p-1.5 text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Forward 30 seconds"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={cycleSpeed}
            className="px-1.5 py-1 text-on-surface-variant hover:text-primary text-xs font-mono transition-colors"
            aria-label={`Playback speed ${playbackRate}x`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
