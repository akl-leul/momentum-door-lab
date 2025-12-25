import { TrendingDown, Clock, Zap, CheckCircle } from 'lucide-react';

interface ComparisonPanelProps {
  withMassImpact: number | null;
  withoutMassImpact: number | null;
  withMassTime: number | null;
  withoutMassTime: number | null;
}

export function ComparisonPanel({
  withMassImpact,
  withoutMassImpact,
  withMassTime,
  withoutMassTime,
}: ComparisonPanelProps) {
  const velocityReduction = 
    withMassImpact !== null && withoutMassImpact !== null && withoutMassImpact > 0
      ? ((withoutMassImpact - withMassImpact) / withoutMassImpact) * 100
      : null;

  const timeIncrease =
    withMassTime !== null && withoutMassTime !== null && withoutMassTime > 0
      ? ((withMassTime - withoutMassTime) / withoutMassTime) * 100
      : null;

  const hasResults = velocityReduction !== null;

  return (
    <div className="sim-panel">
      <h3 className="section-title">Impact Comparison</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Without Counter-Mass */}
        <div className="p-3 rounded-lg bg-sim-door-alt/5 border border-sim-door-alt/20">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-sim-door-alt" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              No Counter-Mass
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" /> Impact ω
              </span>
              <span className="font-mono text-sm font-semibold">
                {withoutMassImpact !== null ? `${withoutMassImpact.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time
              </span>
              <span className="font-mono text-sm font-semibold">
                {withoutMassTime !== null ? `${withoutMassTime.toFixed(2)}s` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* With Counter-Mass */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              With Counter-Mass
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" /> Impact ω
              </span>
              <span className="font-mono text-sm font-semibold">
                {withMassImpact !== null ? `${withMassImpact.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time
              </span>
              <span className="font-mono text-sm font-semibold">
                {withMassTime !== null ? `${withMassTime.toFixed(2)}s` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Summary */}
      {hasResults ? (
        <div className="p-4 rounded-lg bg-sim-success/10 border border-sim-success/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-sim-success" />
            <span className="text-sm font-medium text-foreground">Slam Prevention Effectiveness</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-sim-success">
              {velocityReduction!.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">velocity reduction</span>
          </div>
          {timeIncrease !== null && timeIncrease > 0 && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Impact delayed by {timeIncrease.toFixed(1)}% more time
            </p>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            Press <strong>Play</strong> to run simulation and see comparison results
          </p>
        </div>
      )}
    </div>
  );
}
