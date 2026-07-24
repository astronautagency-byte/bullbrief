import React, { useState, useEffect } from 'react';
import { PodcastEpisode } from '../types';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  ListMusic,
  Clock,
  Search,
  CheckCircle,
  TrendingUp,
  Sliders,
  Sparkles
} from 'lucide-react';

interface PodcastHubProps {
  episodes: PodcastEpisode[];
}

export default function PodcastHub({ episodes }: PodcastHubProps) {
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode>(episodes[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(765); // 12 mins 45s in seconds
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const parseDurationToSeconds = (durationStr: string) => {
    const parts = durationStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 1800; // default 30 mins
  };

  const currentDurationSeconds = parseDurationToSeconds(currentEpisode.duration);

  // Audio simulation timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= currentDurationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, currentDurationSeconds]);

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Change active episode in player
  const selectEpisode = (ep: PodcastEpisode) => {
    setCurrentEpisode(ep);
    setPlaybackTime(0);
    setIsPlaying(true);
  };

  // Filter list
  const filteredEpisodes = episodes.filter((ep) => {
    const query = searchQuery.toLowerCase();
    return (
      ep.title.toLowerCase().includes(query) ||
      ep.category.toLowerCase().includes(query) ||
      ep.text.toLowerCase().includes(query) ||
      ep.author.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col gap-lg w-full animate-fade-in select-none">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-outline pb-4 gap-sm">
        <div>
          <h2 className="font-headline italic text-2xl md:text-3xl text-on-surface tracking-tight flex items-center gap-2 font-light">
            <ListMusic className="w-6 h-6 text-primary" />
            <span>Institutional Podcast Hub</span>
          </h2>
          <p className="font-sans text-xs text-secondary/80">
            Continuous audio briefing analysis. Select any episode to mount the media deck.
          </p>
        </div>

        {/* Global Library Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audio archives..."
            className="w-full bg-surface-container-low border border-outline rounded-none py-2 pl-10 pr-4 text-xs font-sans placeholder:text-secondary/50 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Grid: Media Player Deck and Playlist Library */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left: Media Deck */}
        <div className="lg:col-span-7 bg-surface border border-outline rounded-none p-lg flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-sm">
              <span className="bg-primary text-slate-950 px-3 py-1 rounded-none text-[9px] font-mono font-bold uppercase tracking-[0.2em]">
                {currentEpisode.category}
              </span>
              <span className="font-mono text-[9px] text-tertiary font-bold uppercase tracking-[0.15em]">
                AUTHOR: {currentEpisode.author}
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-md items-start mt-xs mb-md">
              <img
                src={currentEpisode.imageUrl}
                alt={currentEpisode.title}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-none object-cover border border-outline-variant shadow-sm shrink-0"
              />
              <div className="flex flex-col">
                <h3 className="font-headline italic text-xl md:text-2xl text-on-surface leading-tight tracking-tight font-light">
                  {currentEpisode.title}
                </h3>
                <p className="font-sans text-xs text-secondary leading-relaxed mt-2">
                  {currentEpisode.text}
                </p>
              </div>
            </div>
          </div>

          {/* Continuous wave visual bar */}
          <div className="my-md">
            <div className="flex items-center justify-between font-mono text-[10px] text-tertiary mb-1.5 uppercase tracking-wider">
              <span>{formatSeconds(playbackTime)}</span>
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-primary flex items-center gap-1.5 animate-pulse">
                {isPlaying ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                    <span>STREAM ACTIVE</span>
                  </>
                ) : (
                  'STREAM PAUSED'
                )}
              </span>
              <span>{currentEpisode.duration}</span>
            </div>

            {/* Simulated wave bars */}
            <div className="h-10 w-full flex items-end gap-0.5 justify-between px-1 bg-surface-container border border-outline rounded-none p-2 mb-2">
              {Array.from({ length: 48 }).map((_, idx) => {
                const currentPct = (playbackTime / currentDurationSeconds) * 100;
                const barPct = (idx / 48) * 100;
                const isActive = barPct <= currentPct;
                // Generate a nice pseudo-random height
                const barHeight = 10 + Math.sin(idx * 0.4) * 15 + Math.cos(idx * 0.9) * 10;
                return (
                  <div
                    key={idx}
                    className={`w-1 rounded-none transition-all duration-300 ${
                      isActive ? 'bg-primary' : 'bg-outline-variant/30'
                    }`}
                    style={{ height: `${Math.max(4, Math.min(36, barHeight))}px` }}
                  ></div>
                );
              })}
            </div>
          </div>

          {/* Player controls */}
          <div className="bg-surface-container border border-outline rounded-none p-md flex items-center justify-between flex-wrap gap-md">
            <div className="flex items-center gap-sm">
              {/* Skip backward 15s */}
              <button
                onClick={() => setPlaybackTime((prev) => Math.max(0, prev - 15))}
                className="p-2 text-secondary hover:text-primary hover:bg-surface-container-high rounded-none cursor-pointer transition-colors"
                title="Backward 15s"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Central Play Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 bg-primary text-slate-950 rounded-none flex items-center justify-center cursor-pointer hover:bg-opacity-90 active:scale-95 transition-all shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
              </button>

              {/* Skip forward 15s */}
              <button
                onClick={() => setPlaybackTime((prev) => Math.min(currentDurationSeconds, prev + 15))}
                className="p-2 text-secondary hover:text-primary hover:bg-surface-container-high rounded-none cursor-pointer transition-colors"
                title="Forward 15s"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Playback speed selector */}
            <div className="flex items-center gap-1 bg-surface-container-low border border-outline rounded-none p-1">
              {[1, 1.25, 1.5, 1.75].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded-none font-mono text-[11px] font-bold cursor-pointer transition-all ${
                    playbackSpeed === speed
                      ? 'bg-primary text-slate-950'
                      : 'text-secondary hover:bg-surface-container'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-primary">
              <Volume2 className="w-4 h-4" />
              <span>HIGH BITRATE (320KBPS)</span>
            </div>
          </div>
        </div>

        {/* Right: Library Playlist */}
        <div className="lg:col-span-5 bg-surface border border-outline rounded-none p-md flex flex-col gap-md max-h-[520px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-outline pb-xs">
            <h3 className="font-mono text-[10px] font-bold text-tertiary uppercase tracking-[0.2em]">
              PODCAST ARCHIVE LIBRARY
            </h3>
            <span className="font-mono text-[10px] text-secondary font-bold uppercase tracking-wider">
              {filteredEpisodes.length} ARCHIVES
            </span>
          </div>

          <div className="flex flex-col gap-sm">
            {filteredEpisodes.map((ep) => {
              const isSelected = ep.id === currentEpisode.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => selectEpisode(ep)}
                  className={`p-sm border flex items-center gap-md cursor-pointer transition-all group rounded-none ${
                    isSelected
                      ? 'bg-primary/10 border-primary shadow-xs'
                      : 'border-outline-variant bg-transparent hover:bg-surface-container'
                  }`}
                >
                  <img
                    src={ep.imageUrl}
                    alt={ep.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-none object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[9px] font-mono text-tertiary mb-0.5 uppercase">
                      <span>{ep.category}</span>
                      <span className="font-bold flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {ep.duration}
                      </span>
                    </div>
                    <h4 className={`font-headline italic text-xs truncate ${
                      isSelected ? 'text-primary font-semibold' : 'text-on-surface group-hover:text-primary transition-colors'
                    }`}>
                      {ep.title}
                    </h4>
                    <p className="font-sans text-[10px] text-secondary truncate mt-0.5">
                      By {ep.author}
                    </p>
                  </div>

                  <div className="shrink-0 pl-1">
                    {isSelected && isPlaying ? (
                      <div className="w-8 h-8 rounded-none bg-primary/5 flex items-center justify-center">
                        <div className="flex gap-0.5 items-end h-3">
                          <span className="w-0.75 bg-primary animate-[bounce_0.8s_infinite_100ms] h-2"></span>
                          <span className="w-0.75 bg-primary animate-[bounce_0.8s_infinite_300ms] h-3"></span>
                          <span className="w-0.75 bg-primary animate-[bounce_0.8s_infinite_500ms] h-1.5"></span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-none bg-surface border border-outline flex items-center justify-center text-secondary group-hover:text-primary group-hover:border-primary transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
