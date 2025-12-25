import { PhysicsState, calculateTotalAngularMomentum, calculateTotalMomentOfInertia } from '@/lib/physics';
import { Gauge, Activity, LocateFixed, Zap, Clock, Target } from 'lucide-react';

interface DataPanelProps {
  state: PhysicsState;
  initialAngularMomentum: number | null;
}

function DataValue({ 
  label, 
  value, 
  unit, 
  icon: Icon,
  highlight = false,
  warning = false 
}: { 
  label: string; 
  value: string | number; 
  unit: string;
  icon: React.ElementType;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${highlight ? 'text-primary' : warning ? 'text-accent' : 'text-muted-foreground'}`} />
        <span className="sim-label">{label}</span>
      </div>
      <div className={`font-mono text-lg font-semibold ${highlight ? 'text-primary' : warning ? 'text-accent' : 'text-foreground'}`}>
        {typeof value === 'number' ? value.toFixed(3) : value}
        <span className="text-xs text-muted-foreground ml-1">{unit}</span>
      </div>
    </div>
  );
}

export function DataPanel({ state, initialAngularMomentum }: DataPanelProps) {
  const currentL = calculateTotalAngularMomentum(state);
  const totalI = calculateTotalMomentOfInertia(state);
  const angleInDegrees = (state.doorAngle * 180) / Math.PI;
  
  // Calculate conservation error
  const conservationError = initialAngularMomentum !== null 
    ? Math.abs(currentL - initialAngularMomentum) / Math.abs(initialAngularMomentum) * 100
    : 0;

  return (
    <div className="sim-panel space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
        Real-Time Data
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <DataValue
          label="Angular Velocity"
          value={state.doorAngularVelocity}
          unit="rad/s"
          icon={Gauge}
          highlight
        />
        <DataValue
          label="Door Angle"
          value={angleInDegrees}
          unit="°"
          icon={Target}
        />
        <DataValue
          label="Time Elapsed"
          value={state.time}
          unit="s"
          icon={Clock}
        />
        <DataValue
          label="Total Inertia"
          value={totalI}
          unit="kg·m²"
          icon={Activity}
        />
        {state.useCounterMass && (
          <>
            <DataValue
              label="Mass Position"
              value={state.massPosition}
              unit="m"
              icon={LocateFixed}
              warning
            />
            <DataValue
              label="Mass Velocity"
              value={state.massVelocity}
              unit="m/s"
              icon={Zap}
              warning
            />
          </>
        )}
      </div>

      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="sim-label">Angular Momentum (L)</span>
          <span className="text-xs text-muted-foreground">
            Conservation error: {conservationError.toFixed(4)}%
          </span>
        </div>
        <div className="font-mono text-xl font-bold text-primary">
          {currentL.toFixed(4)}
          <span className="text-sm text-muted-foreground ml-1">kg·m²/s</span>
        </div>
      </div>

      {state.hasCollided && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">Impact Detected</span>
          </div>
          <p className="font-mono text-lg text-foreground">
            ω<sub>impact</sub> = {state.impactAngularVelocity?.toFixed(3)} rad/s
          </p>
        </div>
      )}
    </div>
  );
}
