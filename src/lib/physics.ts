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
  
  // Simulation state
  time: number; // seconds
  hasCollided: boolean;
  impactAngularVelocity: number | null;
  
  // Mode
  useCounterMass: boolean;
}

export interface SimulationData {
  time: number;
  doorAngularVelocity: number;
  massPosition: number;
  totalAngularMomentum: number;
  doorAngle: number;
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
// L = m * r * v_tangential
// v_tangential = r * ω + v_radial_component (but mass moves along track)
// For a mass at distance r moving with the door AND sliding:
// L = m * r^2 * ω + m * r * v_radial (contribution from radial sliding)
// But actually, for point mass at radius r:
// L = m * (r × v) = m * r * v_perpendicular
// When mass is on rotating door at distance r: L = m * r^2 * ω
export function calculateMassAngularMomentum(
  mass: number,
  position: number, // distance from hinge
  doorAngularVelocity: number,
  massVelocity: number // radial velocity along track
): number {
  // Angular momentum = m * r^2 * ω (rotation contribution)
  // Plus Coriolis/radial contribution is handled by conservation
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
    state.doorAngularVelocity,
    state.massVelocity
  );
  
  return doorL + massL;
}

// Calculate total moment of inertia (door + mass)
export function calculateTotalMomentOfInertia(state: PhysicsState): number {
  const doorI = calculateDoorMomentOfInertia(state.doorMass, state.doorWidth);
  
  if (!state.useCounterMass) {
    return doorI;
  }
  
  // Point mass at distance r: I = m * r^2
  const massI = state.counterMass * state.massPosition * state.massPosition;
  
  return doorI + massI;
}

// Physics update step using conservation of angular momentum
// When the mass slides outward, the moment of inertia increases,
// so angular velocity must decrease to conserve L
export function updatePhysics(state: PhysicsState, dt: number): PhysicsState {
  if (state.hasCollided) {
    return state;
  }
  
  const newState = { ...state };
  
  // Store initial angular momentum (should be conserved)
  const L_initial = calculateTotalAngularMomentum(state);
  
  if (state.useCounterMass) {
    // The mass experiences a pseudo-force (centrifugal in rotating frame)
    // F = m * ω^2 * r (outward)
    // This causes acceleration: a = ω^2 * r
    const centrifugalAcceleration = 
      state.doorAngularVelocity * state.doorAngularVelocity * state.massPosition;
    
    // Update mass velocity and position
    // Mass accelerates outward due to centrifugal effect
    newState.massVelocity = state.massVelocity + centrifugalAcceleration * dt;
    newState.massPosition = state.massPosition + newState.massVelocity * dt;
    
    // Constrain mass position to track (from 0.1m to door width - 0.1m)
    const minPos = 0.15;
    const maxPos = state.doorWidth - 0.05;
    
    if (newState.massPosition < minPos) {
      newState.massPosition = minPos;
      newState.massVelocity = Math.max(0, newState.massVelocity);
    } else if (newState.massPosition > maxPos) {
      newState.massPosition = maxPos;
      newState.massVelocity = Math.min(0, newState.massVelocity);
    }
    
    // Calculate new moment of inertia
    const I_new = calculateTotalMomentOfInertia(newState);
    
    // Conserve angular momentum: L = I * ω, so ω_new = L / I_new
    newState.doorAngularVelocity = L_initial / I_new;
  }
  
  // Update door angle
  newState.doorAngle = state.doorAngle + newState.doorAngularVelocity * dt;
  newState.time = state.time + dt;
  
  // Check for collision with frame (door closes at angle = 0 or past π/2 = 90°)
  // We'll use 85 degrees as the "slam" point
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
  useCounterMass: boolean
): PhysicsState {
  return {
    doorAngle: 0,
    doorAngularVelocity: initialAngularVelocity,
    doorMass,
    doorWidth,
    massPosition: 0.2, // Start near hinge
    massVelocity: 0,
    counterMass,
    time: 0,
    hasCollided: false,
    impactAngularVelocity: null,
    useCounterMass,
  };
}

// Reset state while preserving parameters
export function resetState(state: PhysicsState): PhysicsState {
  return createInitialState(
    state.doorMass,
    state.doorWidth,
    state.counterMass,
    state.doorAngularVelocity || 2.0, // Default if was 0
    state.useCounterMass
  );
}
