import { Play, Pause, RotateCcw, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface PlaybackControlsProps {
  isPlaying: boolean;
  playbackSpeed: number;
  canReplay: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onReplay: () => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export function PlaybackControls({
  isPlaying,
  playbackSpeed,
  canReplay,
  onPlayPause,
  onReset,
  onReplay,
  onSpeedChange,
  disabled = false,
}: PlaybackControlsProps) {
  const speedLabels: Record<number, string> = {
    0.1: '0.1x',
    0.25: '0.25x',
    0.5: '0.5x',
    1: '1x',
    2: '2x',
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={onPlayPause}
          disabled={disabled && !isPlaying}
          className="flex-1"
          variant={isPlaying ? "destructive" : "default"}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Play
            </>
          )}
        </Button>
        <Button onClick={onReset} variant="outline" disabled={isPlaying}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        {canReplay && (
          <Button onClick={onReplay} variant="secondary" disabled={isPlaying}>
            <Rewind className="h-4 w-4 mr-1" />
            Replay
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs text-muted-foreground">Playback Speed</Label>
          <span className="text-xs font-mono text-primary font-medium">
            {speedLabels[playbackSpeed] || `${playbackSpeed}x`}
          </span>
        </div>
        <Slider
          value={[playbackSpeed]}
          onValueChange={([v]) => onSpeedChange(v)}
          min={0.1}
          max={2}
          step={0.05}
          disabled={isPlaying}
          className="py-1"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>Slow-mo</span>
          <span>Normal</span>
          <span>Fast</span>
        </div>
      </div>
    </div>
  );
}
