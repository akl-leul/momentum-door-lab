import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { PhysicsState } from '@/lib/physics';

interface SimulationVisualizerProps {
  state: PhysicsState;
  showVectors?: boolean;
}

export function SimulationVisualizer({ state, showVectors = true }: SimulationVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    door: THREE.Group;
    doorBody: THREE.Mesh;
    mass: THREE.Mesh;
    track: THREE.Mesh;
    hinge: THREE.Mesh;
    frame: THREE.LineSegments;
    velocityArrow: THREE.Group;
  } | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141820);

    // Orthographic camera (top-down view)
    const aspect = width / height;
    const frustumSize = 3;
    const camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    camera.position.set(0, 10, 0);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Grid
    const gridHelper = new THREE.GridHelper(4, 20, 0x2a3040, 0x1e2530);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    // Door group (rotates around hinge)
    const door = new THREE.Group();
    door.position.set(-0.5, 0, 0); // Hinge position

    // Door body
    const doorGeometry = new THREE.PlaneGeometry(state.doorWidth, 0.08);
    const doorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x22d3ee,
      side: THREE.DoubleSide 
    });
    const doorBody = new THREE.Mesh(doorGeometry, doorMaterial);
    doorBody.position.set(state.doorWidth / 2, 0, 0.01);
    door.add(doorBody);

    // Track (slightly above door)
    const trackGeometry = new THREE.PlaneGeometry(state.doorWidth - 0.1, 0.02);
    const trackMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4b5563,
      side: THREE.DoubleSide 
    });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.position.set(state.doorWidth / 2, 0, 0.02);
    door.add(track);

    // Sliding mass
    const massGeometry = new THREE.CircleGeometry(0.06, 16);
    const massMaterial = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const mass = new THREE.Mesh(massGeometry, massMaterial);
    mass.position.set(state.massPosition, 0, 0.03);
    door.add(mass);

    scene.add(door);

    // Hinge indicator
    const hingeGeometry = new THREE.CircleGeometry(0.05, 16);
    const hingeMaterial = new THREE.MeshBasicMaterial({ color: 0x64748b });
    const hinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
    hinge.position.set(-0.5, 0, 0.02);
    scene.add(hinge);

    // Door frame / stop (at 85 degrees)
    const framePoints = [];
    const frameAngle = (85 * Math.PI) / 180;
    const frameLength = state.doorWidth + 0.1;
    framePoints.push(new THREE.Vector3(-0.5, 0, 0));
    framePoints.push(new THREE.Vector3(
      -0.5 + Math.cos(frameAngle) * frameLength,
      Math.sin(frameAngle) * frameLength,
      0
    ));
    const frameGeometry = new THREE.BufferGeometry().setFromPoints(framePoints);
    const frameMaterial = new THREE.LineBasicMaterial({ 
      color: 0xef4444,
      linewidth: 2,
      opacity: 0.5,
      transparent: true
    });
    const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
    scene.add(frame);

    // Velocity arrow
    const velocityArrow = new THREE.Group();
    const arrowShaft = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xec4899 })
    );
    const arrowHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.08, 8),
      new THREE.MeshBasicMaterial({ color: 0xec4899 })
    );
    arrowHead.rotation.z = -Math.PI / 2;
    arrowHead.position.x = 0.1;
    velocityArrow.add(arrowShaft);
    velocityArrow.add(arrowHead);
    velocityArrow.visible = showVectors;
    scene.add(velocityArrow);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      door,
      doorBody,
      mass,
      track,
      hinge,
      frame,
      velocityArrow,
    };

    // Initial render
    renderer.render(scene, camera);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const newAspect = w / h;
      
      sceneRef.current.camera.left = -frustumSize * newAspect / 2;
      sceneRef.current.camera.right = frustumSize * newAspect / 2;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update visualization based on physics state
  useEffect(() => {
    if (!sceneRef.current) return;

    const { door, doorBody, mass, track, velocityArrow, renderer, scene, camera } = sceneRef.current;

    // Update door geometry if size changed
    const doorGeom = doorBody.geometry as THREE.PlaneGeometry;
    if (doorGeom.parameters.width !== state.doorWidth) {
      doorBody.geometry.dispose();
      doorBody.geometry = new THREE.PlaneGeometry(state.doorWidth, 0.08);
      doorBody.position.set(state.doorWidth / 2, 0, 0.01);
      
      track.geometry.dispose();
      track.geometry = new THREE.PlaneGeometry(state.doorWidth - 0.1, 0.02);
      track.position.set(state.doorWidth / 2, 0, 0.02);
    }

    // Update door rotation
    door.rotation.z = state.doorAngle;

    // Update mass position
    mass.visible = state.useCounterMass;
    mass.position.set(state.massPosition, 0, 0.03);

    // Update velocity arrow
    velocityArrow.visible = showVectors && Math.abs(state.doorAngularVelocity) > 0.01;
    if (velocityArrow.visible) {
      // Position arrow at tip of door
      const tipX = -0.5 + Math.cos(state.doorAngle) * state.doorWidth;
      const tipY = Math.sin(state.doorAngle) * state.doorWidth;
      velocityArrow.position.set(tipX, tipY, 0.05);
      
      // Arrow direction is tangent to rotation
      const tangentAngle = state.doorAngle + Math.PI / 2;
      velocityArrow.rotation.z = tangentAngle;
      
      // Scale based on velocity
      const scale = Math.min(Math.abs(state.doorAngularVelocity) * 0.3, 1);
      velocityArrow.scale.set(scale, 1, 1);
    }

    // Change door color on collision
    (doorBody.material as THREE.MeshBasicMaterial).color.setHex(
      state.hasCollided ? 0xef4444 : 0x22d3ee
    );

    renderer.render(scene, camera);
  }, [state, showVectors]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-border"
    />
  );
}
