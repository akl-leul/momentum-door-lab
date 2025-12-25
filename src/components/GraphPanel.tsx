import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart
} from 'recharts';
import { SimulationData } from '@/lib/physics';

interface GraphPanelProps {
  data: SimulationData[];
  comparisonData?: SimulationData[];
  showComparison: boolean;
}

export function GraphPanel({ data, comparisonData, showComparison }: GraphPanelProps) {
  const chartData = data.map((d, i) => ({
    time: d.time,
    angularVelocity: d.doorAngularVelocity,
    massPosition: d.massPosition,
    angularMomentum: d.totalAngularMomentum,
    kineticEnergy: d.kineticEnergy,
    comparisonVelocity: comparisonData?.[i]?.doorAngularVelocity,
    comparisonMomentum: comparisonData?.[i]?.totalAngularMomentum,
  }));

  const tooltipStyle = {
    backgroundColor: 'hsl(0 0% 100%)',
    border: '1px solid hsl(210 20% 88%)',
    borderRadius: '8px',
    fontSize: '11px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
  };

  return (
    <div className="sim-panel space-y-4">
      <h3 className="section-title">Time Series Analysis</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Angular Velocity */}
        <div className="h-44 bg-muted/30 rounded-lg p-3 border border-border/50">
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Angular Velocity (ω)
          </h4>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 15% 92%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(220 10% 45%)" 
                fontSize={9}
                tickFormatter={(v) => `${v.toFixed(1)}s`}
              />
              <YAxis 
                stroke="hsl(220 10% 45%)" 
                fontSize={9}
                width={35}
                tickFormatter={(v) => `${v.toFixed(1)}`}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line 
                type="monotone" 
                dataKey="angularVelocity" 
                stroke="hsl(200 85% 45%)" 
                strokeWidth={2}
                dot={false}
                name="With Mass"
              />
              {showComparison && comparisonData && (
                <Line 
                  type="monotone" 
                  dataKey="comparisonVelocity" 
                  stroke="hsl(340 75% 55%)" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="No Mass"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Mass Position */}
        <div className="h-44 bg-muted/30 rounded-lg p-3 border border-border/50">
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Mass Position (r)
          </h4>
          <ResponsiveContainer width="100%" height="85%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 15% 92%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(220 10% 45%)" 
                fontSize={9}
                tickFormatter={(v) => `${v.toFixed(1)}s`}
              />
              <YAxis 
                stroke="hsl(220 10% 45%)" 
                fontSize={9}
                width={35}
                domain={[0, 'auto']}
                tickFormatter={(v) => `${v.toFixed(2)}m`}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="massPosition"
                fill="hsl(25 95% 53% / 0.2)"
                stroke="hsl(25 95% 53%)"
                strokeWidth={2}
                name="Position"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Kinetic Energy */}
        <div className="h-44 bg-muted/30 rounded-lg p-3 border border-border/50">
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Kinetic Energy (KE)
          </h4>
          <ResponsiveContainer width="100%" height="85%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 15% 92%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(220 10% 45%)" 
                fontSize={9}
                tickFormatter={(v) => `${v.toFixed(1)}s`}
              />
              <YAxis 
                stroke="hsl(220 10% 45%)" 
                fontSize={9}
                width={40}
                tickFormatter={(v) => `${v.toFixed(1)}J`}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="kineticEnergy"
                fill="hsl(160 65% 40% / 0.2)"
                stroke="hsl(160 65% 40%)"
                strokeWidth={2}
                name="Total KE"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Angular Momentum Conservation - Full Width */}
      <div className="h-40 bg-muted/30 rounded-lg p-3 border border-border/50">
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Angular Momentum Conservation (L = I × ω)
        </h4>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 15% 92%)" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(220 10% 45%)" 
              fontSize={9}
              tickFormatter={(v) => `${v.toFixed(1)}s`}
            />
            <YAxis 
              stroke="hsl(220 10% 45%)" 
              fontSize={9}
              width={50}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${v.toFixed(2)}`}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Line 
              type="monotone" 
              dataKey="angularMomentum" 
              stroke="hsl(200 85% 45%)" 
              strokeWidth={2}
              dot={false}
              name="With Counter-Mass"
            />
            {showComparison && comparisonData && (
              <Line 
                type="monotone" 
                dataKey="comparisonMomentum" 
                stroke="hsl(340 75% 55%)" 
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name="Without Counter-Mass"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
