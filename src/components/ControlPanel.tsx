import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Weight, Ruler, Gauge, CircleDot, Columns, Waves, Wind } from 'lucide-react';

interface ControlPanelProps {
  doorMass: number;
  doorWidth: number;
  counterMass: number;
  initialVelocity: number;
  frictionCoefficient: number;
  windTorque: number;
  useCounterMass: boolean;
  sideBySideMode: boolean;
  isPlaying: boolean;
  onDoorMassChange: (value: number) => void;
  onDoorWidthChange: (value: number) => void;
  onCounterMassChange: (value: number) => void;
  onInitialVelocityChange: (value: number) => void;
  onFrictionChange: (value: number) => void;
  onWindTorqueChange: (value: number) => void;
  onUseCounterMassChange: (value: boolean) => void;
  onSideBySideModeChange: (value: boolean) => void;
  onPlayPause: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function ControlPanel({
  doorMass,
  doorWidth,
  counterMass,
  initialVelocity,
  frictionCoefficient,
  windTorque,
  useCounterMass,
  sideBySideMode,
  isPlaying,
  onDoorMassChange,
  onDoorWidthChange,
  onCounterMassChange,
  onInitialVelocityChange,
  onFrictionChange,
  onWindTorqueChange,
  onUseCounterMassChange,
  onSideBySideModeChange,
  onPlayPause,
  onReset,
  disabled = false,
}: ControlPanelProps) {
  return (
    <div className="sim-panel space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="section-title mb-0">Controls</h3>
        <div className="flex gap-2">
          <Button
            variant={isPlaying ? "default" : "outline"}
            size="sm"
            onClick={onPlayPause}
            className="h-8 px-3"
          >
            {isPlaying ? (
              <><Pause className="h-3.5 w-3.5 mr-1.5" /> Pause</>
            ) : (
              <><Play className="h-3.5 w-3.5 mr-1.5" /> Play</>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onReset}
            className="h-8 w-8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Mode toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2.5">
            <CircleDot className="h-4 w-4 text-accent" />
            <div>
              <Label className="text-sm font-medium">Counter-Mass</Label>
              <p className="text-[11px] text-muted-foreground">Enable sliding mass on door</p>
            </div>
          </div>
          <Switch
            checked={useCounterMass}
            onCheckedChange={onUseCounterMassChange}
            disabled={disabled || sideBySideMode}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2.5">
            <Columns className="h-4 w-4 text-primary" />
            <div>
              <Label className="text-sm font-medium">Side-by-Side</Label>
              <p className="text-[11px] text-muted-foreground">Compare both modes live</p>
            </div>
          </div>
          <Switch
            checked={sideBySideMode}
            onCheckedChange={onSideBySideModeChange}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Door Mass */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-sm">
              <Weight className="h-3.5 w-3.5 text-muted-foreground" />
              Door Mass
            </Label>
            <span className="font-mono text-sm font-medium text-foreground">{doorMass.toFixed(1)} kg</span>
          </div>
          <Slider
            value={[doorMass]}
            onValueChange={([v]) => onDoorMassChange(v)}
            min={5}
            max={30}
            step={0.5}
            disabled={disabled}
            className="py-1"
          />
        </div>

        {/* Door Width */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-sm">
              <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
              Door Width
            </Label>
            <span className="font-mono text-sm font-medium text-foreground">{doorWidth.toFixed(2)} m</span>
          </div>
          <Slider
            value={[doorWidth]}
            onValueChange={([v]) => onDoorWidthChange(v)}
            min={0.6}
            max={1.2}
            step={0.05}
            disabled={disabled}
            className="py-1"
          />
        </div>

        {/* Counter Mass */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-sm">
              <CircleDot className="h-3.5 w-3.5 text-accent" />
              Sliding Mass
            </Label>
            <span className="font-mono text-sm font-medium text-accent">{counterMass.toFixed(1)} kg</span>
          </div>
          <Slider
            value={[counterMass]}
            onValueChange={([v]) => onCounterMassChange(v)}
            min={0.5}
            max={5}
            step={0.1}
            disabled={disabled || (!useCounterMass && !sideBySideMode)}
            className="py-1"
          />
        </div>

        {/* Initial Angular Velocity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-sm">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              Initial ω
            </Label>
            <span className="font-mono text-sm font-medium text-foreground">{initialVelocity.toFixed(1)} rad/s</span>
          </div>
          <Slider
            value={[initialVelocity]}
            onValueChange={([v]) => onInitialVelocityChange(v)}
            min={0.5}
            max={5}
            step={0.1}
            disabled={disabled}
            className="py-1"
          />
        </div>

        {/* Friction Coefficient */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-sm">
              <Waves className="h-3.5 w-3.5 text-muted-foreground" />
              Track Friction (μ)
            </Label>
            <span className="font-mono text-sm font-medium text-foreground">{frictionCoefficient.toFixed(2)}</span>
          </div>
          <Slider
            value={[frictionCoefficient]}
            onValueChange={([v]) => onFrictionChange(v)}
            min={0}
            max={0.5}
            step={0.01}
            disabled={disabled || (!useCounterMass && !sideBySideMode)}
            className="py-1"
          />
          <p className="text-[10px] text-muted-foreground">
            0 = frictionless · 0.5 = high friction
          </p>
        </div>

        {/* Wind Torque */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-sm">
              <Wind className="h-3.5 w-3.5 text-sky-500" />
              Wind Force
            </Label>
            <span className="font-mono text-sm font-medium text-sky-600">{windTorque.toFixed(1)} N⋅m</span>
          </div>
          <Slider
            value={[windTorque]}
            onValueChange={([v]) => onWindTorqueChange(v)}
            min={0}
            max={20}
            step={0.5}
            disabled={disabled}
            className="py-1"
          />
          <p className="text-[10px] text-muted-foreground">
            Torque pushing door closed · Higher = stronger wind
          </p>
        </div>
      </div>
    </div>
  );
}
