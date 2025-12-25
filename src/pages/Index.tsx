import { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationVisualizer } from '@/components/SimulationVisualizer';
import { ControlPanel } from '@/components/ControlPanel';
import { DataPanel } from '@/components/DataPanel';
import { GraphPanel } from '@/components/GraphPanel';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import {
  PhysicsState,
  SimulationData,
  createInitialState,
  updatePhysics,
  calculateTotalAngularMomentum,
} from '@/lib/physics';
import { Info } from 'lucide-react';

const TIMESTEP = 1 / 120; // 120 Hz physics update
const DATA_SAMPLE_RATE = 5; // Sample every 5th frame

export default function Index() {
  // Simulation parameters
  const [doorMass, setDoorMass] = useState(15);
  const [doorWidth, setDoorWidth] = useState(0.9);
  const [counterMass, setCounterMass] = useState(2);
  const [initialVelocity, setInitialVelocity] = useState(2.5);
  const [useCounterMass, setUseCounterMass] = useState(true);
  
  // Simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [state, setState] = useState<PhysicsState>(() =>
    createInitialState(doorMass, doorWidth, counterMass, initialVelocity, useCounterMass)
  );
  const [historyData, setHistoryData] = useState<SimulationData[]>([]);
  const [initialAngularMomentum, setInitialAngularMomentum] = useState<number | null>(null);
  
  // Comparison data
  const [comparisonData, setComparisonData] = useState<SimulationData[]>([]);
  const [withMassResult, setWithMassResult] = useState<{ impact: number; time: number } | null>(null);
  const [withoutMassResult, setWithoutMassResult] = useState<{ impact: number; time: number } | null>(null);
  
  const frameRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Reset simulation
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    const newState = createInitialState(doorMass, doorWidth, counterMass, initialVelocity, useCounterMass);
    setState(newState);
    setHistoryData([]);
    setInitialAngularMomentum(null);
    frameRef.current = 0;
  }, [doorMass, doorWidth, counterMass, initialVelocity, useCounterMass]);

  // Run comparison simulation (without counter-mass)
  const runComparisonSimulation = useCallback(() => {
    let compState = createInitialState(doorMass, doorWidth, counterMass, initialVelocity, false);
    const data: SimulationData[] = [];
    let frame = 0;

    while (!compState.hasCollided && compState.time < 10) {
      compState = updatePhysics(compState, TIMESTEP);
      if (frame % DATA_SAMPLE_RATE === 0) {
        data.push({
          time: compState.time,
          doorAngularVelocity: compState.doorAngularVelocity,
          massPosition: compState.massPosition,
          totalAngularMomentum: calculateTotalAngularMomentum(compState),
          doorAngle: compState.doorAngle,
        });
      }
      frame++;
    }

    setComparisonData(data);
    if (compState.hasCollided && compState.impactAngularVelocity !== null) {
      setWithoutMassResult({
        impact: compState.impactAngularVelocity,
        time: compState.time,
      });
    }
  }, [doorMass, doorWidth, counterMass, initialVelocity]);

  // Physics loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Record initial angular momentum on first play
    if (initialAngularMomentum === null) {
      setInitialAngularMomentum(calculateTotalAngularMomentum(state));
      // Also run comparison simulation
      runComparisonSimulation();
    }

    let lastTime = performance.now();
    let accumulator = 0;

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      accumulator += delta;

      // Fixed timestep physics updates
      while (accumulator >= TIMESTEP) {
        setState((prev) => {
          if (prev.hasCollided) {
            setIsPlaying(false);
            // Record result
            if (prev.useCounterMass && prev.impactAngularVelocity !== null) {
              setWithMassResult({
                impact: prev.impactAngularVelocity,
                time: prev.time,
              });
            }
            return prev;
          }

          const newState = updatePhysics(prev, TIMESTEP);

          // Sample data for graphs
          if (frameRef.current % DATA_SAMPLE_RATE === 0) {
            setHistoryData((h) => [
              ...h,
              {
                time: newState.time,
                doorAngularVelocity: newState.doorAngularVelocity,
                massPosition: newState.massPosition,
                totalAngularMomentum: calculateTotalAngularMomentum(newState),
                doorAngle: newState.doorAngle,
              },
            ]);
          }

          frameRef.current++;
          return newState;
        });

        accumulator -= TIMESTEP;
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, initialAngularMomentum, runComparisonSimulation]);

  // Reset when parameters change
  useEffect(() => {
    handleReset();
    setWithMassResult(null);
    setWithoutMassResult(null);
    setComparisonData([]);
  }, [doorMass, doorWidth, counterMass, initialVelocity, useCounterMass]);

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
          Momentum-Powered Door Slam Preventer
        </h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Angular momentum conservation simulation — purely classical mechanics
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Column: Controls & Data */}
        <div className="lg:col-span-3 space-y-4">
          <ControlPanel
            doorMass={doorMass}
            doorWidth={doorWidth}
            counterMass={counterMass}
            initialVelocity={initialVelocity}
            useCounterMass={useCounterMass}
            isPlaying={isPlaying}
            onDoorMassChange={setDoorMass}
            onDoorWidthChange={setDoorWidth}
            onCounterMassChange={setCounterMass}
            onInitialVelocityChange={setInitialVelocity}
            onUseCounterMassChange={setUseCounterMass}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onReset={handleReset}
            disabled={isPlaying}
          />
          <DataPanel state={state} initialAngularMomentum={initialAngularMomentum} />
        </div>

        {/* Center: Visualization */}
        <div className="lg:col-span-5">
          <div className="sim-panel h-[400px] lg:h-[500px]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-3">
              Top-Down View
            </h3>
            <SimulationVisualizer state={state} showVectors />
          </div>
        </div>

        {/* Right Column: Comparison & Explanation */}
        <div className="lg:col-span-4 space-y-4">
          <ComparisonPanel
            withMassImpact={withMassResult?.impact ?? null}
            withoutMassImpact={withoutMassResult?.impact ?? null}
            withMassTime={withMassResult?.time ?? null}
            withoutMassTime={withoutMassResult?.time ?? null}
          />
          
          {/* Physics Equations Card */}
          <div className="sim-panel">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-3">
              Governing Equations
            </h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="p-2 rounded bg-secondary/50">
                <span className="text-muted-foreground">Door Inertia:</span>
                <p className="text-primary mt-1">I<sub>door</sub> = ⅓ × M × L²</p>
              </div>
              <div className="p-2 rounded bg-secondary/50">
                <span className="text-muted-foreground">Mass Inertia:</span>
                <p className="text-accent mt-1">I<sub>mass</sub> = m × r²</p>
              </div>
              <div className="p-2 rounded bg-secondary/50">
                <span className="text-muted-foreground">Conservation:</span>
                <p className="text-sim-success mt-1">L = I<sub>total</sub> × ω = const</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Graphs */}
        <div className="lg:col-span-12">
          <GraphPanel
            data={historyData}
            comparisonData={comparisonData}
            showComparison={comparisonData.length > 0}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-xs text-muted-foreground">
        <p>
          This simulation demonstrates conservation of angular momentum. 
          No springs, dampers, or artificial friction — only classical mechanics.
        </p>
      </footer>
    </div>
  );
}
