import React, { useState, useEffect } from "react";
import { Volume2, Play, Pause } from "lucide-react";
import { Card, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

export function AudioPlayerCard() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(38);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    let timer = null;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setAudioProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio, playbackSpeed]);

  const handleTogglePlay = () => {
    setIsPlayingAudio(!isPlayingAudio);
    toast.info(isPlayingAudio ? "Audio dijeda." : "Memutar rekaman audio guru!");
  };

  const handleToggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    toast.info(`Kecepatan: ${next}x`);
  };

  return (
    <Card className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold border-none">
            <Volume2 className="h-3.5 w-3.5" /> Model 2: Audio Suara
          </Badge>
          <span className="text-[11px] text-indigo-600 font-mono font-bold">12m 25s</span>
        </div>
        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
          Rekaman Penjelasan Vokal Dosen / Guru
        </h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          Ibu Yulia menjelaskan pemahaman pointer dan analogi lemari kontigu pada struktur data.
        </p>

        {/* Interactive Waveform Bar Visualizer */}
        <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center justify-between gap-1 h-8">
            {[40, 65, 80, 50, 95, 30, 75, 85, 45, 90, 60, 100, 70, 85, 40, 60, 75, 90, 50, 70].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={cn(
                  "flex-1 rounded-full transition-all duration-200",
                  i < Math.floor((audioProgress / 100) * 20)
                    ? "bg-blue-600"
                    : "bg-slate-200"
                )}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>04:45</span>
            <span>12:25</span>
          </div>
        </div>
      </div>

      <CardFooter className="p-0 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Button
          size="sm"
          onClick={handleTogglePlay}
          className="rounded-xl text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
        >
          {isPlayingAudio ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isPlayingAudio ? "Jeda Audio" : "Putar Audio"}
        </Button>

        <button
          onClick={handleToggleSpeed}
          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-mono text-[11px] font-bold text-slate-700 cursor-pointer transition-colors"
        >
          {playbackSpeed}x
        </button>
      </CardFooter>
    </Card>
  );
}
