import { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationVisualizer3D } from '@/components/SimulationVisualizer3D';
import { ControlPanel } from '@/components/ControlPanel';
import { DataPanel } from '@/components/DataPanel';
import { GraphPanel } from '@/components/GraphPanel';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { EnergyPanel } from '@/components/EnergyPanel';
import {
  PhysicsState,
  SimulationData,
  EnergyBreakdown,
  createInitialState,
  updatePhysics,
  calculateTotalAngularMomentum,
  calculateEnergyBreakdown,
  runFullSimulation,
} from '@/lib/physics';
import { Info, Atom } from 'lucide-react';

const TIMESTEP = 1 / 120;
const DATA_SAMPLE_RATE = 4;

export default function Index() {
  // Simulation parameters
  const [doorMass, setDoorMass] = useState(15);
  const [doorWidth, setDoorWidth] = useState(0.9);
  const [counterMass, setCounterMass] = useState(2);
  const [initialVelocity, setInitialVelocity] = useState(2.5);
  const [frictionCoefficient, setFrictionCoefficient] = useState(0.02);
  const [useCounterMass, setUseCounterMass] = useState(true);
  const [sideBySideMode, setSideBySideMode] = useState(false);
  
  // Simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [state, setState] = useState<PhysicsState>(() =>
    createInitialState(doorMass, doorWidth, counterMass, initialVelocity, true, frictionCoefficient)
  );
  const [altState, setAltState] = useState<PhysicsState | null>(null);
  const [historyData, setHistoryData] = useState<SimulationData[]>([]);
  const [initialAngularMomentum, setInitialAngularMomentum] = useState<number | null>(null);
  const [energy, setEnergy] = useState<EnergyBreakdown>(() => calculateEnergyBreakdown(state));
  
  // Comparison data
  const [comparisonData, setComparisonData] = useState<SimulationData[]>([]);
  const [withMassResult, setWithMassResult] = useState<{ impact: number; time: number } | null>(null);
  const [withoutMassResult, setWithoutMassResult] = useState<{ impact: number; time: number } | null>(null);
  
  const frameRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Reset simulation
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    
    const effectiveUseCounterMass = sideBySideMode ? true : useCounterMass;
    const newState = createInitialState(
      doorMass, doorWidth, counterMass, initialVelocity, 
      effectiveUseCounterMass, frictionCoefficient
    );
    setState(newState);
    setEnergy(calculateEnergyBreakdown(newState));
    
    if (sideBySideMode) {
      const newAltState = createInitialState(
        doorMass, doorWidth, counterMass, initialVelocity,
        false, frictionCoefficient
      );
      setAltState(newAltState);
    } else {
      setAltState(null);
    }
    
    setHistoryData([]);
    setInitialAngularMomentum(null);
    setComparisonData([]);
    setWithMassResult(null);
    setWithoutMassResult(null);
    frameRef.current = 0;
  }, [doorMass, doorWidth, counterMass, initialVelocity, useCounterMass, frictionCoefficient, sideBySideMode]);

  // Run comparison (non-side-by-side mode)
  const runComparisonSimulation = useCallback(() => {
    if (sideBySideMode) return;
    
    const result = runFullSimulation(
      doorMass, doorWidth, counterMass, initialVelocity,
      false, frictionCoefficient, TIMESTEP, DATA_SAMPLE_RATE
    );
    
    setComparisonData(result.data);
    if (result.finalState.hasCollided && result.finalState.impactAngularVelocity !== null) {
      setWithoutMassResult({
        impact: result.finalState.impactAngularVelocity,
        time: result.finalState.time,
      });
    }
  }, [doorMass, doorWidth, counterMass, initialVelocity, frictionCoefficient, sideBySideMode]);

  // Physics loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    if (initialAngularMomentum === null) {
      setInitialAngularMomentum(calculateTotalAngularMomentum(state));
      if (!sideBySideMode && useCounterMass) {
        runComparisonSimulation();
      }
    }

    let lastTime = performance.now();
    let accumulator = 0;

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      accumulator += delta;

      while (accumulator >= TIMESTEP) {
        // Update primary state
        setState((prev) => {
          if (prev.hasCollided) {
            // Record result
            if (prev.impactAngularVelocity !== null) {
              if (prev.useCounterMass || sideBySideMode) {
                setWithMassResult({ impact: prev.impactAngularVelocity, time: prev.time });
              } else {
                setWithoutMassResult({ impact: prev.impactAngularVelocity, time: prev.time });
              }
            }
            return prev;
          }

          const newState = updatePhysics(prev, TIMESTEP);
          setEnergy(calculateEnergyBreakdown(newState));

          // Sample data
          if (frameRef.current % DATA_SAMPLE_RATE === 0) {
            const energyData = calculateEnergyBreakdown(newState);
            setHistoryData((h) => [
              ...h,
              {
                time: newState.time,
                doorAngularVelocity: newState.doorAngularVelocity,
                massPosition: newState.massPosition,
                totalAngularMomentum: calculateTotalAngularMomentum(newState),
                doorAngle: newState.doorAngle,
                kineticEnergy: energyData.total,
                rotationalEnergy: energyData.doorRotational + energyData.massRotational,
                massKineticEnergy: energyData.massLinear,
              },
            ]);
          }

          return newState;
        });

        // Update alt state in side-by-side mode
        if (sideBySideMode) {
          setAltState((prev) => {
            if (!prev || prev.hasCollided) {
              if (prev?.hasCollided && prev.impactAngularVelocity !== null) {
                setWithoutMassResult({ impact: prev.impactAngularVelocity, time: prev.time });
              }
              return prev;
            }
            return updatePhysics(prev, TIMESTEP);
          });
        }

        frameRef.current++;
        accumulator -= TIMESTEP;
      }

      // Check if both simulations are done
      setState((prev) => {
        if (prev.hasCollided) {
          if (sideBySideMode) {
            setAltState((alt) => {
              if (alt?.hasCollided) {
                setIsPlaying(false);
              }
              return alt;
            });
          } else {
            setIsPlaying(false);
          }
        }
        return prev;
      });

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, initialAngularMomentum, runComparisonSimulation, sideBySideMode, useCounterMass]);

  // Reset when parameters change
  useEffect(() => {
    handleReset();
  }, [doorMass, doorWidth, counterMass, initialVelocity, frictionCoefficient, useCounterMass, sideBySideMode]);

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <Atom className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            Momentum-Powered Door Slam Preventer
          </h1>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2 ml-12">
          <Info className="h-3.5 w-3.5" />
          Angular momentum conservation simulation — pure classical mechanics, no artificial damping
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5">
        {/* Left Column: Controls */}
        <div className="xl:col-span-3 space-y-4">
          <ControlPanel
            doorMass={doorMass}
            doorWidth={doorWidth}
            counterMass={counterMass}
            initialVelocity={initialVelocity}
            frictionCoefficient={frictionCoefficient}
            useCounterMass={useCounterMass}
            sideBySideMode={sideBySideMode}
            isPlaying={isPlaying}
            onDoorMassChange={setDoorMass}
            onDoorWidthChange={setDoorWidth}
            onCounterMassChange={setCounterMass}
            onInitialVelocityChange={setInitialVelocity}
            onFrictionChange={setFrictionCoefficient}
            onUseCounterMassChange={setUseCounterMass}
            onSideBySideModeChange={setSideBySideMode}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onReset={handleReset}
            disabled={isPlaying}
          />
          
          {/* Equations Card */}
          <div className="sim-panel-compact">
            <h4 className="section-title">Governing Equations</h4>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Door Inertia:</span>
                <p className="text-primary mt-0.5">I<sub>door</sub> = ⅓ × M × L²</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Mass Inertia:</span>
                <p className="text-accent mt-0.5">I<sub>mass</sub> = m × r²</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Conservation:</span>
                <p className="text-sim-success mt-0.5">L = I<sub>total</sub> × ω = const</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center: 3D Visualization */}
        <div className="xl:col-span-5">
          <div className="sim-panel h-[420px] lg:h-[480px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title mb-0">3D View</h3>
              <span className="text-[10px] text-muted-foreground">Drag to rotate • Scroll to zoom</span>
            </div>
            <SimulationVisualizer3D 
              state={state} 
              altState={altState}
              showVectors 
              sideBySide={sideBySideMode}
            />
            {sideBySideMode && (
              <div className="flex justify-center gap-6 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-muted-foreground">With Counter-Mass</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-sim-door-alt" />
                  <span className="text-muted-foreground">Without Counter-Mass</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Data & Results */}
        <div className="xl:col-span-4 space-y-4">
          <DataPanel state={state} initialAngularMomentum={initialAngularMomentum} />
          <EnergyPanel energy={energy} initialEnergy={state.initialKineticEnergy} />
          <ComparisonPanel
            withMassImpact={withMassResult?.impact ?? null}
            withoutMassImpact={withoutMassResult?.impact ?? null}
            withMassTime={withMassResult?.time ?? null}
            withoutMassTime={withoutMassResult?.time ?? null}
          />
        </div>

        {/* Bottom: Graphs */}
        <div className="xl:col-span-12">
          <GraphPanel
            data={historyData}
            comparisonData={sideBySideMode ? undefined : comparisonData}
            showComparison={!sideBySideMode && comparisonData.length > 0}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-xs text-muted-foreground">
        <p>
          This is a physics experiment in code. Conservation of angular momentum demonstrated through pure classical mechanics.
        </p>
      </footer>
    </div>
  );
}
