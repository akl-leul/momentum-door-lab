import { EnergyBreakdown } from '@/lib/physics';
import { Battery, Zap, RotateCcw, TrendingDown } from 'lucide-react';

interface EnergyPanelProps {
  energy: EnergyBreakdown;
  initialEnergy: number;
}

export function EnergyPanel({ energy, initialEnergy }: EnergyPanelProps) {
  const efficiencyPercent = initialEnergy > 0 
    ? ((energy.total / initialEnergy) * 100).toFixed(1)
    : '100.0';
  
  const doorPercent = energy.total > 0 ? (energy.doorRotational / energy.total) * 100 : 0;
  const massRotPercent = energy.total > 0 ? (energy.massRotational / energy.total) * 100 : 0;
  const massLinPercent = energy.total > 0 ? (energy.massLinear / energy.total) * 100 : 0;

  return (
    <div className="sim-panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title mb-0">Energy Analysis</h3>
        <div className="data-chip">
          <Battery className="h-3.5 w-3.5 text-primary" />
          <span>{efficiencyPercent}% retained</span>
        </div>
      </div>

      {/* Energy bar visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Energy Distribution</span>
          <span className="font-mono text-foreground">{energy.total.toFixed(3)} J</span>
        </div>
        
        <div className="h-6 rounded-md overflow-hidden flex bg-muted">
          <div 
            className="bg-primary transition-all duration-200"
            style={{ width: `${doorPercent}%` }}
            title={`Door Rotational: ${energy.doorRotational.toFixed(4)} J`}
          />
          <div 
            className="bg-sim-energy-rotational transition-all duration-200"
            style={{ width: `${massRotPercent}%` }}
            title={`Mass Rotational: ${energy.massRotational.toFixed(4)} J`}
          />
          <div 
            className="bg-accent transition-all duration-200"
            style={{ width: `${massLinPercent}%` }}
            title={`Mass Linear: ${energy.massLinear.toFixed(4)} J`}
          />
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">Door ({doorPercent.toFixed(0)}%)</span>
          </div>
          {massRotPercent > 0.5 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-sim-energy-rotational" />
              <span className="text-muted-foreground">Mass Rot. ({massRotPercent.toFixed(0)}%)</span>
            </div>
          )}
          {massLinPercent > 0.5 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-accent" />
              <span className="text-muted-foreground">Mass Lin. ({massLinPercent.toFixed(0)}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <RotateCcw className="h-3 w-3 text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Door KE</span>
          </div>
          <p className="font-mono text-sm font-semibold">{energy.doorRotational.toFixed(4)} J</p>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="h-3 w-3 text-sim-energy-rotational" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mass Rot. KE</span>
          </div>
          <p className="font-mono text-sm font-semibold">{energy.massRotational.toFixed(4)} J</p>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="h-3 w-3 text-accent" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mass Lin. KE</span>
          </div>
          <p className="font-mono text-sm font-semibold">{energy.massLinear.toFixed(4)} J</p>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="h-3 w-3 text-destructive" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Friction Loss</span>
          </div>
          <p className="font-mono text-sm font-semibold">{energy.lostToFriction.toFixed(4)} J</p>
        </div>
      </div>

      {/* Physics note */}
      <div className="p-2.5 rounded-md bg-muted/50 text-xs text-muted-foreground">
        <p>
          <strong className="text-foreground">Note:</strong> As the mass slides outward, 
          kinetic energy redistributes while angular momentum (L) stays constant. 
          Friction converts kinetic energy to heat.
        </p>
      </div>
    </div>
  );
}
