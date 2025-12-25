// Physics Engine for Angular Momentum Conservation Simulation
// All calculations use SI units internally

export interface PhysicsState {
  // Door properties
  doorAngle: number; // radians
  doorAngularVelocity: number; // rad/s
  doorMass: number; // kg
  doorWidth: number; // meters
  
  // Sliding mass properties
  massPosition: number; // meters from hinge (along track)
  massVelocity: number; // m/s (along track)
  counterMass: number; // kg
  
  // Friction
  frictionCoefficient: number; // dimensionless (0-1)
  
  // Simulation state
  time: number; // seconds
  hasCollided: boolean;
  impactAngularVelocity: number | null;
  peakAngularVelocity: number;
  
  // Mode
  useCounterMass: boolean;
  
  // Energy tracking
  initialKineticEnergy: number;
  energyLostToFriction: number;
}

export interface SimulationData {
  time: number;
  doorAngularVelocity: number;
  massPosition: number;
  totalAngularMomentum: number;
  doorAngle: number;
  kineticEnergy: number;
  rotationalEnergy: number;
  massKineticEnergy: number;
}

export interface EnergyBreakdown {
  doorRotational: number;
  massRotational: number;
  massLinear: number;
  total: number;
  lostToFriction: number;
}

// Calculate moment of inertia of door (rod about one end)
// I = (1/3) * M * L^2
export function calculateDoorMomentOfInertia(mass: number, width: number): number {
  return (1 / 3) * mass * width * width;
}

// Calculate angular momentum of the door
// L = I * ω
export function calculateDoorAngularMomentum(
  doorMass: number,
  doorWidth: number,
  angularVelocity: number
): number {
  const I = calculateDoorMomentOfInertia(doorMass, doorWidth);
  return I * angularVelocity;
}

// Calculate angular momentum of the sliding mass
// For a mass at distance r rotating with the door: L = m * r^2 * ω
export function calculateMassAngularMomentum(
  mass: number,
  position: number,
  doorAngularVelocity: number
): number {
  return mass * position * position * doorAngularVelocity;
}

// Calculate total system angular momentum
export function calculateTotalAngularMomentum(state: PhysicsState): number {
  const doorL = calculateDoorAngularMomentum(
    state.doorMass,
    state.doorWidth,
    state.doorAngularVelocity
  );
  
  if (!state.useCounterMass) {
    return doorL;
  }
  
  const massL = calculateMassAngularMomentum(
    state.counterMass,
    state.massPosition,
    state.doorAngularVelocity
  );
  
  return doorL + massL;
}

// Calculate total moment of inertia
export function calculateTotalMomentOfInertia(state: PhysicsState): number {
  const doorI = calculateDoorMomentOfInertia(state.doorMass, state.doorWidth);
  
  if (!state.useCounterMass) {
    return doorI;
  }
  
  const massI = state.counterMass * state.massPosition * state.massPosition;
  return doorI + massI;
}

// Calculate energy breakdown
export function calculateEnergyBreakdown(state: PhysicsState): EnergyBreakdown {
  const doorI = calculateDoorMomentOfInertia(state.doorMass, state.doorWidth);
  
  // Door rotational kinetic energy: E = 0.5 * I * ω²
  const doorRotational = 0.5 * doorI * state.doorAngularVelocity * state.doorAngularVelocity;
  
  let massRotational = 0;
  let massLinear = 0;
  
  if (state.useCounterMass) {
    // Mass rotational energy (due to door rotation)
    const massI = state.counterMass * state.massPosition * state.massPosition;
    massRotational = 0.5 * massI * state.doorAngularVelocity * state.doorAngularVelocity;
    
    // Mass linear kinetic energy (sliding along track)
    massLinear = 0.5 * state.counterMass * state.massVelocity * state.massVelocity;
  }
  
  return {
    doorRotational,
    massRotational,
    massLinear,
    total: doorRotational + massRotational + massLinear,
    lostToFriction: state.energyLostToFriction,
  };
}

// Calculate total kinetic energy
export function calculateTotalKineticEnergy(state: PhysicsState): number {
  return calculateEnergyBreakdown(state).total;
}

// Physics update with friction
export function updatePhysics(state: PhysicsState, dt: number): PhysicsState {
  if (state.hasCollided) {
    return state;
  }
  
  const newState = { ...state };
  
  // Store initial angular momentum (for conservation check)
  const L_initial = calculateTotalAngularMomentum(state);
  
  if (state.useCounterMass) {
    // Centrifugal acceleration: a = ω² * r
    const centrifugalAcceleration = 
      state.doorAngularVelocity * state.doorAngularVelocity * state.massPosition;
    
    // Friction force opposes motion
    // F_friction = μ * m * g (simplified - assumes horizontal track)
    // But we want friction proportional to normal force from centrifugal effect
    // N = m * ω² * r, so F_friction = μ * m * ω² * r
    const frictionDeceleration = state.frictionCoefficient * centrifugalAcceleration;
    
    // Net acceleration (friction opposes outward motion when sliding out)
    let netAcceleration = centrifugalAcceleration;
    if (state.massVelocity > 0) {
      netAcceleration -= frictionDeceleration;
    } else if (state.massVelocity < 0) {
      netAcceleration += frictionDeceleration;
    }
    
    // Track energy lost to friction
    const frictionForce = state.counterMass * frictionDeceleration;
    const distanceMoved = Math.abs(state.massVelocity * dt);
    newState.energyLostToFriction = state.energyLostToFriction + frictionForce * distanceMoved;
    
    // Update mass velocity and position
    newState.massVelocity = state.massVelocity + netAcceleration * dt;
    newState.massPosition = state.massPosition + newState.massVelocity * dt;
    
    // Constrain mass position to track
    const minPos = 0.12;
    const maxPos = state.doorWidth - 0.05;
    
    if (newState.massPosition < minPos) {
      newState.massPosition = minPos;
      newState.massVelocity = Math.max(0, newState.massVelocity);
    } else if (newState.massPosition > maxPos) {
      newState.massPosition = maxPos;
      newState.massVelocity = Math.min(0, newState.massVelocity);
    }
    
    // Conserve angular momentum (modified by friction effects indirectly)
    const I_new = calculateTotalMomentOfInertia(newState);
    
    // In ideal case (no friction), L is exactly conserved
    // With friction, we approximate by using the initial L
    // (friction primarily affects the mass's ability to slide, not angular momentum directly)
    newState.doorAngularVelocity = L_initial / I_new;
  }
  
  // Update door angle
  newState.doorAngle = state.doorAngle + newState.doorAngularVelocity * dt;
  newState.time = state.time + dt;
  
  // Track peak angular velocity
  if (Math.abs(newState.doorAngularVelocity) > Math.abs(newState.peakAngularVelocity)) {
    newState.peakAngularVelocity = newState.doorAngularVelocity;
  }
  
  // Check for collision (door closes at ~85 degrees)
  const maxAngle = (85 * Math.PI) / 180;
  
  if (newState.doorAngle >= maxAngle) {
    newState.hasCollided = true;
    newState.impactAngularVelocity = newState.doorAngularVelocity;
    newState.doorAngle = maxAngle;
    newState.doorAngularVelocity = 0;
  }
  
  return newState;
}

// Create initial state
export function createInitialState(
  doorMass: number,
  doorWidth: number,
  counterMass: number,
  initialAngularVelocity: number,
  useCounterMass: boolean,
  frictionCoefficient: number = 0
): PhysicsState {
  const state: PhysicsState = {
    doorAngle: 0,
    doorAngularVelocity: initialAngularVelocity,
    doorMass,
    doorWidth,
    massPosition: 0.15,
    massVelocity: 0,
    counterMass,
    frictionCoefficient,
    time: 0,
    hasCollided: false,
    impactAngularVelocity: null,
    peakAngularVelocity: initialAngularVelocity,
    useCounterMass,
    initialKineticEnergy: 0,
    energyLostToFriction: 0,
  };
  
  state.initialKineticEnergy = calculateTotalKineticEnergy(state);
  
  return state;
}

// Run a complete simulation and return all data points
export function runFullSimulation(
  doorMass: number,
  doorWidth: number,
  counterMass: number,
  initialAngularVelocity: number,
  useCounterMass: boolean,
  frictionCoefficient: number,
  timestep: number = 1 / 120,
  sampleRate: number = 5
): { data: SimulationData[]; finalState: PhysicsState } {
  let state = createInitialState(
    doorMass,
    doorWidth,
    counterMass,
    initialAngularVelocity,
    useCounterMass,
    frictionCoefficient
  );
  
  const data: SimulationData[] = [];
  let frame = 0;
  const maxTime = 10; // Safety limit
  
  while (!state.hasCollided && state.time < maxTime) {
    if (frame % sampleRate === 0) {
      const energy = calculateEnergyBreakdown(state);
      data.push({
        time: state.time,
        doorAngularVelocity: state.doorAngularVelocity,
        massPosition: state.massPosition,
        totalAngularMomentum: calculateTotalAngularMomentum(state),
        doorAngle: state.doorAngle,
        kineticEnergy: energy.total,
        rotationalEnergy: energy.doorRotational + energy.massRotational,
        massKineticEnergy: energy.massLinear,
      });
    }
    state = updatePhysics(state, timestep);
    frame++;
  }
  
  // Add final data point
  const finalEnergy = calculateEnergyBreakdown(state);
  data.push({
    time: state.time,
    doorAngularVelocity: state.doorAngularVelocity,
    massPosition: state.massPosition,
    totalAngularMomentum: calculateTotalAngularMomentum(state),
    doorAngle: state.doorAngle,
    kineticEnergy: finalEnergy.total,
    rotationalEnergy: finalEnergy.doorRotational + finalEnergy.massRotational,
    massKineticEnergy: finalEnergy.massLinear,
  });
  
  return { data, finalState: state };
}
