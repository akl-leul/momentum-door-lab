import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { SimulationData } from '@/lib/physics';

interface GraphPanelProps {
  data: SimulationData[];
  comparisonData?: SimulationData[];
  showComparison: boolean;
}

export function GraphPanel({ data, comparisonData, showComparison }: GraphPanelProps) {
  // Merge data for comparison if available
  const chartData = data.map((d, i) => ({
    time: d.time,
    angularVelocity: d.doorAngularVelocity,
    massPosition: d.massPosition,
    angularMomentum: d.totalAngularMomentum,
    comparisonVelocity: comparisonData?.[i]?.doorAngularVelocity,
  }));

  return (
    <div className="sim-panel space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
        Time Series Analysis
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Angular Velocity Graph */}
        <div className="h-48 bg-secondary/30 rounded-lg p-3">
          <h4 className="text-xs text-muted-foreground mb-2">Angular Velocity (ω) vs Time</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(200 10% 55%)" 
                fontSize={10}
                tickFormatter={(v) => `${v.toFixed(1)}s`}
              />
              <YAxis 
                stroke="hsl(200 10% 55%)" 
                fontSize={10}
                tickFormatter={(v) => `${v.toFixed(1)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220 18% 12%)',
                  border: '1px solid hsl(220 15% 20%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(200 20% 95%)' }}
              />
              <Line 
                type="monotone" 
                dataKey="angularVelocity" 
                stroke="hsl(180 70% 50%)" 
                strokeWidth={2}
                dot={false}
                name="With Counter-Mass"
              />
              {showComparison && comparisonData && (
                <Line 
                  type="monotone" 
                  dataKey="comparisonVelocity" 
                  stroke="hsl(0 70% 50%)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Without Counter-Mass"
                />
              )}
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Mass Position Graph */}
        <div className="h-48 bg-secondary/30 rounded-lg p-3">
          <h4 className="text-xs text-muted-foreground mb-2">Mass Position (r) vs Time</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(200 10% 55%)" 
                fontSize={10}
                tickFormatter={(v) => `${v.toFixed(1)}s`}
              />
              <YAxis 
                stroke="hsl(200 10% 55%)" 
                fontSize={10}
                domain={[0, 'auto']}
                tickFormatter={(v) => `${v.toFixed(2)}m`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220 18% 12%)',
                  border: '1px solid hsl(220 15% 20%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(200 20% 95%)' }}
              />
              <Line 
                type="monotone" 
                dataKey="massPosition" 
                stroke="hsl(35 90% 55%)" 
                strokeWidth={2}
                dot={false}
                name="Mass Position"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Angular Momentum Conservation Graph */}
        <div className="h-48 bg-secondary/30 rounded-lg p-3 lg:col-span-2">
          <h4 className="text-xs text-muted-foreground mb-2">Angular Momentum (L) vs Time — Conservation Verification</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(200 10% 55%)" 
                fontSize={10}
                tickFormatter={(v) => `${v.toFixed(1)}s`}
              />
              <YAxis 
                stroke="hsl(200 10% 55%)" 
                fontSize={10}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220 18% 12%)',
                  border: '1px solid hsl(220 15% 20%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(200 20% 95%)' }}
              />
              <Line 
                type="monotone" 
                dataKey="angularMomentum" 
                stroke="hsl(160 70% 45%)" 
                strokeWidth={2}
                dot={false}
                name="Angular Momentum"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
