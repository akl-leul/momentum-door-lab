import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { PhysicsState } from '@/lib/physics';
import { createWindParticleSystem, WindIndicator } from './WindParticles';

interface SimulationVisualizer3DProps {
  state: PhysicsState;
  altState?: PhysicsState | null;
  showVectors?: boolean;
  sideBySide?: boolean;
  isPlaying?: boolean;
}

export function SimulationVisualizer3D({ 
  state, 
  altState, 
  showVectors = true,
  sideBySide = false,
  isPlaying = false,
}: SimulationVisualizer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const windParticlesRef = useRef<ReturnType<typeof createWindParticleSystem> | null>(null);
  const lastTimeRef = useRef(performance.now());
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    door: THREE.Group;
    doorBody: THREE.Mesh;
    mass: THREE.Mesh;
    track: THREE.Mesh;
    hinge: THREE.Mesh;
    frameStop: THREE.Mesh;
    floor: THREE.Mesh;
    // Alt door for side-by-side
    altDoor?: THREE.Group;
    altDoorBody?: THREE.Mesh;
    altMass?: THREE.Mesh;
    velocityArrow: THREE.Group;
    altVelocityArrow?: THREE.Group;
  } | null>(null);
  
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: Math.PI / 4, phi: Math.PI / 3 });
  const cameraDistance = useRef(3.5);

  const updateCameraPosition = useCallback(() => {
    if (!sceneRef.current) return;
    const { camera } = sceneRef.current;
    const { theta, phi } = cameraAngle.current;
    const dist = cameraDistance.current;
    
    camera.position.x = dist * Math.sin(phi) * Math.cos(theta);
    camera.position.y = dist * Math.cos(phi);
    camera.position.z = dist * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(0, 0.3, 0);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    // Perspective camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Floor with grid
    const floorGeometry = new THREE.PlaneGeometry(6, 6);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf1f5f9,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid helper
    const gridHelper = new THREE.GridHelper(6, 30, 0xdee2e6, 0xe9ecef);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    // Hinge position offset for side-by-side
    const hingeOffset = sideBySide ? -0.8 : 0;

    // Door group
    const door = new THREE.Group();
    door.position.set(hingeOffset - 0.5, 0.5, 0);

    // Door body (3D box)
    const doorGeometry = new THREE.BoxGeometry(state.doorWidth, 1.0, 0.04);
    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0891b2,
      roughness: 0.3,
      metalness: 0.2,
    });
    const doorBody = new THREE.Mesh(doorGeometry, doorMaterial);
    doorBody.position.set(state.doorWidth / 2, 0, 0);
    doorBody.castShadow = true;
    door.add(doorBody);

    // Track on door
    const trackGeometry = new THREE.BoxGeometry(state.doorWidth - 0.1, 0.03, 0.06);
    const trackMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x64748b,
      roughness: 0.5,
    });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.position.set(state.doorWidth / 2, 0.4, 0.03);
    door.add(track);

    // Sliding mass
    const massGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const massMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf97316,
      roughness: 0.2,
      metalness: 0.5,
    });
    const mass = new THREE.Mesh(massGeometry, massMaterial);
    mass.position.set(state.massPosition, 0.4, 0.06);
    mass.castShadow = true;
    door.add(mass);

    scene.add(door);

    // Hinge indicator
    const hingeGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 16);
    const hingeMaterial = new THREE.MeshStandardMaterial({ color: 0x374151 });
    const hinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
    hinge.position.set(hingeOffset - 0.5, 0.5, 0);
    scene.add(hinge);

    // Frame stop (at 85 degrees)
    const frameAngle = (85 * Math.PI) / 180;
    const frameStopGeometry = new THREE.BoxGeometry(0.05, 1.0, 0.1);
    const frameStopMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xef4444,
      transparent: true,
      opacity: 0.7,
    });
    const frameStop = new THREE.Mesh(frameStopGeometry, frameStopMaterial);
    frameStop.position.set(
      hingeOffset - 0.5 + Math.cos(frameAngle) * (state.doorWidth + 0.05),
      0.5,
      Math.sin(frameAngle) * (state.doorWidth + 0.05)
    );
    frameStop.rotation.y = -frameAngle;
    scene.add(frameStop);

    // Velocity arrow
    const velocityArrow = new THREE.Group();
    const arrowShaftGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8);
    const arrowHeadGeom = new THREE.ConeGeometry(0.03, 0.06, 8);
    const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0xec4899 });
    const arrowShaft = new THREE.Mesh(arrowShaftGeom, arrowMaterial);
    arrowShaft.rotation.z = Math.PI / 2;
    const arrowHead = new THREE.Mesh(arrowHeadGeom, arrowMaterial);
    arrowHead.rotation.z = -Math.PI / 2;
    arrowHead.position.x = 0.13;
    velocityArrow.add(arrowShaft);
    velocityArrow.add(arrowHead);
    velocityArrow.visible = false;
    scene.add(velocityArrow);

    // Alt door for side-by-side mode
    let altDoor: THREE.Group | undefined;
    let altDoorBody: THREE.Mesh | undefined;
    let altMass: THREE.Mesh | undefined;
    let altVelocityArrow: THREE.Group | undefined;

    if (sideBySide) {
      const altHingeOffset = 0.8;
      
      altDoor = new THREE.Group();
      altDoor.position.set(altHingeOffset - 0.5, 0.5, 0);

      const altDoorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xdb2777,
        roughness: 0.3,
        metalness: 0.2,
      });
      altDoorBody = new THREE.Mesh(doorGeometry.clone(), altDoorMaterial);
      altDoorBody.position.set(state.doorWidth / 2, 0, 0);
      altDoorBody.castShadow = true;
      altDoor.add(altDoorBody);

      // No track/mass on alt door (it's the "no counter-mass" simulation)
      scene.add(altDoor);

      // Alt hinge
      const altHinge = new THREE.Mesh(hingeGeometry.clone(), hingeMaterial.clone());
      altHinge.position.set(altHingeOffset - 0.5, 0.5, 0);
      scene.add(altHinge);

      // Alt frame stop
      const altFrameStop = new THREE.Mesh(frameStopGeometry.clone(), frameStopMaterial.clone());
      altFrameStop.position.set(
        altHingeOffset - 0.5 + Math.cos(frameAngle) * (state.doorWidth + 0.05),
        0.5,
        Math.sin(frameAngle) * (state.doorWidth + 0.05)
      );
      altFrameStop.rotation.y = -frameAngle;
      scene.add(altFrameStop);

      // Alt velocity arrow
      altVelocityArrow = new THREE.Group();
      const altArrowShaft = new THREE.Mesh(arrowShaftGeom.clone(), new THREE.MeshStandardMaterial({ color: 0xdb2777 }));
      altArrowShaft.rotation.z = Math.PI / 2;
      const altArrowHead = new THREE.Mesh(arrowHeadGeom.clone(), new THREE.MeshStandardMaterial({ color: 0xdb2777 }));
      altArrowHead.rotation.z = -Math.PI / 2;
      altArrowHead.position.x = 0.13;
      altVelocityArrow.add(altArrowShaft);
      altVelocityArrow.add(altArrowHead);
      altVelocityArrow.visible = false;
      scene.add(altVelocityArrow);
    }

    // Create wind particle system
    windParticlesRef.current = createWindParticleSystem(scene, state.windTorque);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      door,
      doorBody,
      mass,
      track,
      hinge,
      frameStop,
      floor,
      altDoor,
      altDoorBody,
      altMass,
      velocityArrow,
      altVelocityArrow,
    };

    renderer.render(scene, camera);

    // Mouse controls for camera
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - prevMouse.current.x;
      const deltaY = e.clientY - prevMouse.current.y;
      
      cameraAngle.current.theta += deltaX * 0.01;
      cameraAngle.current.phi = Math.max(0.3, Math.min(Math.PI / 2 - 0.1, cameraAngle.current.phi - deltaY * 0.01));
      
      updateCameraPosition();
      renderer.render(scene, camera);
      
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance.current = Math.max(2, Math.min(8, cameraDistance.current + e.deltaY * 0.005));
      updateCameraPosition();
      renderer.render(scene, camera);
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
      sceneRef.current.renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      if (windParticlesRef.current) {
        windParticlesRef.current.dispose();
        windParticlesRef.current = null;
      }
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [sideBySide, updateCameraPosition]);

  // Update visualization
  useEffect(() => {
    if (!sceneRef.current) return;

    const { door, doorBody, mass, velocityArrow, altDoor, altVelocityArrow, renderer, scene, camera } = sceneRef.current;

    // Update door rotation (rotate around Y axis for horizontal swing)
    door.rotation.y = -state.doorAngle;

    // Update mass
    mass.visible = state.useCounterMass;
    mass.position.x = state.massPosition;

    // Update velocity arrow
    if (showVectors && Math.abs(state.doorAngularVelocity) > 0.01 && !state.hasCollided) {
      velocityArrow.visible = true;
      const tipX = door.position.x + Math.cos(state.doorAngle) * state.doorWidth;
      const tipZ = Math.sin(state.doorAngle) * state.doorWidth;
      velocityArrow.position.set(tipX, 0.8, tipZ);
      velocityArrow.rotation.y = -(state.doorAngle + Math.PI / 2);
      const scale = Math.min(Math.abs(state.doorAngularVelocity) * 0.4, 1.5);
      velocityArrow.scale.set(scale, 1, 1);
    } else {
      velocityArrow.visible = false;
    }

    // Change door color on collision
    (doorBody.material as THREE.MeshStandardMaterial).color.setHex(
      state.hasCollided ? 0xef4444 : 0x0891b2
    );

    // Update alt door if in side-by-side mode
    if (altDoor && altState) {
      altDoor.rotation.y = -altState.doorAngle;
      
      if (altVelocityArrow && showVectors && Math.abs(altState.doorAngularVelocity) > 0.01 && !altState.hasCollided) {
        altVelocityArrow.visible = true;
        const tipX = altDoor.position.x + Math.cos(altState.doorAngle) * altState.doorWidth;
        const tipZ = Math.sin(altState.doorAngle) * altState.doorWidth;
        altVelocityArrow.position.set(tipX, 0.8, tipZ);
        altVelocityArrow.rotation.y = -(altState.doorAngle + Math.PI / 2);
        const scale = Math.min(Math.abs(altState.doorAngularVelocity) * 0.4, 1.5);
        altVelocityArrow.scale.set(scale, 1, 1);
      } else if (altVelocityArrow) {
        altVelocityArrow.visible = false;
      }

      const altDoorBody = sceneRef.current.altDoorBody;
      if (altDoorBody) {
        (altDoorBody.material as THREE.MeshStandardMaterial).color.setHex(
          altState.hasCollided ? 0xef4444 : 0xdb2777
        );
      }
    }

    // Update wind particles
    if (windParticlesRef.current && isPlaying) {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      windParticlesRef.current.update(delta, state.windTorque);
    }

    renderer.render(scene, camera);
  }, [state, altState, showVectors, isPlaying]);

  return (
    <div className="relative w-full h-full">
      <WindIndicator windTorque={state.windTorque} />
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[350px] sim-canvas cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
