import { runFullSimulation } from '../src/lib/physics';

// Configuration
const DOOR_MASS = 15;
const DOOR_WIDTH = 0.9;
const COUNTER_MASS = 12; // As set by user
const INITIAL_VELOCITY = 3.0;
const FRICTION = 0.02;

console.log("Running Physics Verification...");
console.log("--------------------------------");
console.log(`Door Mass: ${DOOR_MASS} kg`);
console.log(`Counter Mass: ${COUNTER_MASS} kg`);
console.log(`Initial Velocity: ${INITIAL_VELOCITY} rad/s`);

// 1. Run Control (No Counter Mass) - Corresponds to "Pink Door"
const controlResult = runFullSimulation(
    DOOR_MASS,
    DOOR_WIDTH,
    COUNTER_MASS,
    INITIAL_VELOCITY,
    false, // useCounterMass = false
    FRICTION
);

const controlTime = controlResult.finalState.time;
const controlImpact = controlResult.finalState.impactAngularVelocity;

console.log(`\n[Control - No Mass]`);
console.log(`Time to Close: ${controlTime.toFixed(4)} s`);
console.log(`Impact Velocity: ${controlImpact?.toFixed(4)} rad/s`);

// 2. Run Test (With Counter Mass) - Corresponds to "Cyan Door"
const testResult = runFullSimulation(
    DOOR_MASS,
    DOOR_WIDTH,
    COUNTER_MASS,
    INITIAL_VELOCITY,
    true, // useCounterMass = true
    FRICTION
);

const testTime = testResult.finalState.time;
const testImpact = testResult.finalState.impactAngularVelocity;

console.log(`\n[Test - With Mass]`);
console.log(`Time to Close: ${testTime.toFixed(4)} s`);
console.log(`Impact Velocity: ${testImpact ? testImpact.toFixed(4) + ' rad/s' : 'Did not close (Stopped)'}`);

// Verification Logic
console.log(`\n--------------------------------`);
if (controlTime < testTime) {
    console.log("✅ SUCCESS: Door without mass closed FASTER.");
} else {
    console.log("❌ FAILURE: Door without mass NOT faster.");
}

if (testImpact === null || (controlImpact && testImpact < controlImpact)) {
    console.log("✅ SUCCESS: Door with mass has REDUCED impact velocity.");
} else {
    console.log("❌ FAILURE: Impact velocity not reduced.");
}
