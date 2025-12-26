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
  const [counterMass, setCounterMass] = useState(12); // Much heavier for maximum dramatic effect
  const [initialVelocity, setInitialVelocity] = useState(0.5); // Lower initial velocity - wind will push it
  const [frictionCoefficient, setFrictionCoefficient] = useState(0.0); // Zero friction for max sliding speed
  const [windTorque, setWindTorque] = useState(8.0); // Wind pushes door closed
  const [useCounterMass, setUseCounterMass] = useState(true);
  const [sideBySideMode, setSideBySideMode] = useState(true);

  // Simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [state, setState] = useState<PhysicsState>(() =>
    createInitialState(doorMass, doorWidth, counterMass, initialVelocity, true, frictionCoefficient, windTorque)
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
      effectiveUseCounterMass, frictionCoefficient, windTorque
    );
    setState(newState);
    setEnergy(calculateEnergyBreakdown(newState));

    if (sideBySideMode) {
      const newAltState = createInitialState(
        doorMass, doorWidth, counterMass, initialVelocity,
        false, frictionCoefficient, windTorque
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
  }, [doorMass, doorWidth, counterMass, initialVelocity, useCounterMass, frictionCoefficient, windTorque, sideBySideMode]);

  // Run comparison (non-side-by-side mode)
  const runComparisonSimulation = useCallback(() => {
    if (sideBySideMode) return;

    const result = runFullSimulation(
      doorMass, doorWidth, counterMass, initialVelocity,
      false, frictionCoefficient, windTorque, TIMESTEP, DATA_SAMPLE_RATE
    );

    setComparisonData(result.data);
    if (result.finalState.hasCollided && result.finalState.impactAngularVelocity !== null) {
      setWithoutMassResult({
        impact: result.finalState.impactAngularVelocity,
        time: result.finalState.time,
      });
    }
  }, [doorMass, doorWidth, counterMass, initialVelocity, frictionCoefficient, windTorque, sideBySideMode]);

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
      const primaryL = calculateTotalAngularMomentum(state);
      setInitialAngularMomentum(primaryL);

      // In side-by-side mode, also track alt state initial momentum
      if (sideBySideMode && altState) {
        const altL = calculateTotalAngularMomentum(altState);
        // We could track this separately if needed
      }

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
            // Update alt state (without counter-mass)
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
  }, [isPlaying, initialAngularMomentum, runComparisonSimulation, sideBySideMode, useCounterMass, handleReset]);

  // Reset when parameters change
  useEffect(() => {
    handleReset();
  }, [doorMass, doorWidth, counterMass, initialVelocity, frictionCoefficient, windTorque, useCounterMass, sideBySideMode]);

  return (
    <div className="h-screen bg-background p-3 lg:p-4 overflow-hidden">
      {/* Header */}
      <header className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Atom className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
            Momentum-Powered Door Slam Preventer
          </h1>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-2 ml-8">
          <Info className="h-3 w-3" />
          Angular momentum conservation simulation — pure classical mechanics, no artificial damping
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-120px)]">
        {/* Left Column: Controls */}
        <div className="lg:col-span-3 space-y-3 overflow-y-auto">
          <ControlPanel
            doorMass={doorMass}
            doorWidth={doorWidth}
            counterMass={counterMass}
            initialVelocity={initialVelocity}
            frictionCoefficient={frictionCoefficient}
            windTorque={windTorque}
            useCounterMass={useCounterMass}
            sideBySideMode={sideBySideMode}
            isPlaying={isPlaying}
            onDoorMassChange={setDoorMass}
            onDoorWidthChange={setDoorWidth}
            onCounterMassChange={setCounterMass}
            onInitialVelocityChange={setInitialVelocity}
            onFrictionChange={setFrictionCoefficient}
            onWindTorqueChange={setWindTorque}
            onUseCounterMassChange={setUseCounterMass}
            onSideBySideModeChange={setSideBySideMode}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onReset={handleReset}
            disabled={isPlaying}
          />

          {/* Equations Card */}
          <div className="sim-panel-compact">
            <h4 className="section-title text-sm">Governing Equations</h4>
            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="p-1.5 rounded bg-muted/50">
                <span className="text-muted-foreground">Door Inertia:</span>
                <p className="text-primary mt-0.5">I<sub>door</sub> = ⅓ × M × L²</p>
              </div>
              <div className="p-1.5 rounded bg-muted/50">
                <span className="text-muted-foreground">Mass Inertia:</span>
                <p className="text-accent mt-0.5">I<sub>mass</sub> = m × r²</p>
              </div>
              <div className="p-1.5 rounded bg-muted/50">
                <span className="text-muted-foreground">Conservation:</span>
                <p className="text-sim-success mt-0.5">L = I<sub>total</sub> × ω = const</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center: 3D Visualization */}
        <div className="lg:col-span-5">
          <div className="sim-panel h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="section-title mb-0 text-sm">3D Comparison View</h3>
              <span className="text-[9px] text-muted-foreground">Drag to rotate • Scroll to zoom</span>
            </div>
            <div className="h-[calc(100%-40px)]">
              <SimulationVisualizer3D
                state={state}
                altState={altState}
                showVectors
                sideBySide={sideBySideMode}
              />
            </div>
            {sideBySideMode && (
              <div className="flex justify-center gap-6 mt-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded bg-primary" />
                  <span className="text-muted-foreground font-medium">With Counter-Mass (Slower)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded bg-sim-door-alt" />
                  <span className="text-muted-foreground font-medium">Without Counter-Mass (Faster)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Data & Results */}
        <div className="lg:col-span-4 space-y-3 overflow-y-auto">
          <DataPanel state={state} initialAngularMomentum={initialAngularMomentum} />
          <EnergyPanel energy={energy} initialEnergy={state.initialKineticEnergy} />
          <ComparisonPanel
            withMassImpact={withMassResult?.impact ?? null}
            withoutMassImpact={withoutMassResult?.impact ?? null}
            withMassTime={withMassResult?.time ?? null}
            withoutMassTime={withoutMassResult?.time ?? null}
          />

          {/* Compact Graph */}
          <div className="sim-panel-compact">
            <h4 className="section-title text-sm mb-2">Performance Graph</h4>
            <div className="h-32">
              <GraphPanel
                data={historyData}
                comparisonData={sideBySideMode ? undefined : comparisonData}
                showComparison={!sideBySideMode && comparisonData.length > 0}
                compact={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
