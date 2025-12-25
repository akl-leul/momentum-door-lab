import { PhysicsState, calculateTotalAngularMomentum, calculateTotalMomentOfInertia } from '@/lib/physics';
import { Gauge, Activity, LocateFixed, Zap, Clock, Target, TrendingDown } from 'lucide-react';

interface DataPanelProps {
  state: PhysicsState;
  initialAngularMomentum: number | null;
}

function DataValue({ 
  label, 
  value, 
  unit, 
  icon: Icon,
  colorClass = "text-foreground"
}: { 
  label: string; 
  value: string | number; 
  unit: string;
  icon: React.ElementType;
  colorClass?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3 w-3 ${colorClass}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={`font-mono text-sm font-semibold ${colorClass}`}>
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
  
  const conservationError = initialAngularMomentum !== null && Math.abs(initialAngularMomentum) > 0.001
    ? Math.abs(currentL - initialAngularMomentum) / Math.abs(initialAngularMomentum) * 100
    : 0;

  return (
    <div className="sim-panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title mb-0">Live Data</h3>
        {state.hasCollided && (
          <span className="data-chip text-destructive bg-destructive/10">
            <Zap className="h-3 w-3" />
            Impact!
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2.5">
        <DataValue
          label="Angular Velocity"
          value={state.doorAngularVelocity}
          unit="rad/s"
          icon={Gauge}
          colorClass="text-primary"
        />
        <DataValue
          label="Door Angle"
          value={angleInDegrees}
          unit="°"
          icon={Target}
        />
        <DataValue
          label="Time"
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
              colorClass="text-accent"
            />
            <DataValue
              label="Mass Velocity"
              value={state.massVelocity}
              unit="m/s"
              icon={TrendingDown}
              colorClass="text-accent"
            />
          </>
        )}
      </div>

      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Angular Momentum (L)</span>
          <span className="text-[10px] text-muted-foreground">
            Error: {conservationError.toFixed(4)}%
          </span>
        </div>
        <div className="font-mono text-lg font-bold text-primary">
          {currentL.toFixed(4)}
          <span className="text-xs text-muted-foreground ml-1">kg·m²/s</span>
        </div>
      </div>

      {state.hasCollided && state.impactAngularVelocity !== null && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="text-[10px] uppercase tracking-wider text-destructive mb-1">
            Impact Angular Velocity
          </div>
          <p className="font-mono text-lg font-bold text-foreground">
            {state.impactAngularVelocity.toFixed(3)} rad/s
          </p>
        </div>
      )}
    </div>
  );
}
