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

  return (
    <div className="sim-panel">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
        Impact Comparison
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Without Counter-Mass */}
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="text-xs uppercase tracking-wider text-destructive mb-2">
            Without Counter-Mass
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Impact ω</span>
              <p className="font-mono text-lg font-bold text-foreground">
                {withoutMassImpact !== null ? `${withoutMassImpact.toFixed(3)} rad/s` : '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Time to Impact</span>
              <p className="font-mono text-lg font-bold text-foreground">
                {withoutMassTime !== null ? `${withoutMassTime.toFixed(3)} s` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* With Counter-Mass */}
        <div className="p-4 rounded-lg bg-sim-success/10 border border-sim-success/20">
          <div className="text-xs uppercase tracking-wider text-sim-success mb-2">
            With Counter-Mass
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Impact ω</span>
              <p className="font-mono text-lg font-bold text-foreground">
                {withMassImpact !== null ? `${withMassImpact.toFixed(3)} rad/s` : '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Time to Impact</span>
              <p className="font-mono text-lg font-bold text-foreground">
                {withMassTime !== null ? `${withMassTime.toFixed(3)} s` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reduction Stats */}
      {velocityReduction !== null && (
        <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider text-primary mb-1">
              Angular Velocity Reduction
            </div>
            <div className="font-mono text-3xl font-bold text-primary">
              {velocityReduction.toFixed(1)}%
            </div>
            {timeIncrease !== null && (
              <p className="text-xs text-muted-foreground mt-2">
                Impact delayed by {timeIncrease.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Physics Explanation */}
      <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-2">
        <p>
          <strong className="text-foreground">Conservation of Angular Momentum:</strong>{' '}
          L = I × ω remains constant. When the sliding mass moves outward, 
          the moment of inertia I increases, causing angular velocity ω to decrease.
        </p>
        <p className="font-mono text-primary/80">
          I<sub>door</sub> = ⅓ML² | L<sub>total</sub> = I<sub>total</sub> × ω
        </p>
      </div>
    </div>
  );
}
