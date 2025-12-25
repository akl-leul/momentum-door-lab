import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Weight, Ruler, Gauge, CircleDot } from 'lucide-react';

interface ControlPanelProps {
  doorMass: number;
  doorWidth: number;
  counterMass: number;
  initialVelocity: number;
  useCounterMass: boolean;
  isPlaying: boolean;
  onDoorMassChange: (value: number) => void;
  onDoorWidthChange: (value: number) => void;
  onCounterMassChange: (value: number) => void;
  onInitialVelocityChange: (value: number) => void;
  onUseCounterMassChange: (value: boolean) => void;
  onPlayPause: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function ControlPanel({
  doorMass,
  doorWidth,
  counterMass,
  initialVelocity,
  useCounterMass,
  isPlaying,
  onDoorMassChange,
  onDoorWidthChange,
  onCounterMassChange,
  onInitialVelocityChange,
  onUseCounterMassChange,
  onPlayPause,
  onReset,
  disabled = false,
}: ControlPanelProps) {
  return (
    <div className="sim-panel space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Simulation Controls
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPlayPause}
            className="h-9 w-9"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onReset}
            className="h-9 w-9"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Counter-mass toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
        <div className="flex items-center gap-3">
          <CircleDot className="h-4 w-4 text-accent" />
          <div>
            <Label className="text-sm font-medium">Counter-Mass</Label>
            <p className="text-xs text-muted-foreground">Enable sliding mass</p>
          </div>
        </div>
        <Switch
          checked={useCounterMass}
          onCheckedChange={onUseCounterMassChange}
          disabled={disabled}
        />
      </div>

      <div className="space-y-5">
        {/* Door Mass */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <Weight className="h-3.5 w-3.5 text-muted-foreground" />
              Door Mass
            </Label>
            <span className="font-mono text-sm text-primary">{doorMass.toFixed(1)} kg</span>
          </div>
          <Slider
            value={[doorMass]}
            onValueChange={([v]) => onDoorMassChange(v)}
            min={5}
            max={30}
            step={0.5}
            disabled={disabled}
          />
        </div>

        {/* Door Width */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
              Door Width
            </Label>
            <span className="font-mono text-sm text-primary">{doorWidth.toFixed(2)} m</span>
          </div>
          <Slider
            value={[doorWidth]}
            onValueChange={([v]) => onDoorWidthChange(v)}
            min={0.6}
            max={1.2}
            step={0.05}
            disabled={disabled}
          />
        </div>

        {/* Counter Mass */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <CircleDot className="h-3.5 w-3.5 text-accent" />
              Counter-Mass
            </Label>
            <span className="font-mono text-sm text-accent">{counterMass.toFixed(1)} kg</span>
          </div>
          <Slider
            value={[counterMass]}
            onValueChange={([v]) => onCounterMassChange(v)}
            min={0.5}
            max={5}
            step={0.1}
            disabled={disabled || !useCounterMass}
            className={!useCounterMass ? 'opacity-50' : ''}
          />
        </div>

        {/* Initial Angular Velocity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              Initial ω
            </Label>
            <span className="font-mono text-sm text-primary">{initialVelocity.toFixed(1)} rad/s</span>
          </div>
          <Slider
            value={[initialVelocity]}
            onValueChange={([v]) => onInitialVelocityChange(v)}
            min={0.5}
            max={5}
            step={0.1}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
