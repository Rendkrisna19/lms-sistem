import React, { useState } from "react";
import { Video, Play } from "lucide-react";
import { Card, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { toast } from "sonner";

export function VideoPlayerCard() {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const handleOpenVideo = () => {
    setIsPlayingVideo(true);
    toast.info("Membuka Video Player Mode Fokus HD.");
  };

  return (
    <Card className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold border-none">
            <Video className="h-3.5 w-3.5" /> Model 3: Video Tutorial
          </Badge>
          <span className="text-[11px] text-purple-600 font-mono font-bold">15m 30s</span>
        </div>
        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
          Simulasi Visual Animasi Traversal HD
        </h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          Animasi grafis resolusi 1080p memperlihatkan iterasi loop for menelusuri setiap blok array.
        </p>

        {/* Video Thumbnail with Play Button */}
        <div
          onClick={handleOpenVideo}
          className="mt-3.5 relative h-24 rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center cursor-pointer group shadow-inner"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="h-10 w-10 rounded-full bg-white/90 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <Play className="h-4 w-4 ml-0.5" />
          </div>
          <span className="absolute bottom-2 right-2.5 text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded font-mono">
            1080p HD
          </span>
        </div>
      </div>

      <CardFooter className="p-0 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Button
          size="sm"
          onClick={handleOpenVideo}
          className="rounded-xl text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
        >
          <Play className="h-3.5 w-3.5" /> Tonton Video HD
        </Button>
        <span className="text-[11px] text-slate-400 font-mono">15m 30s</span>
      </CardFooter>
    </Card>
  );
}
