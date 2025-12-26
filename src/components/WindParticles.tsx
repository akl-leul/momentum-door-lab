import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WindParticlesProps {
  scene: THREE.Scene;
  windTorque: number;
  isPlaying: boolean;
}

export function createWindParticleSystem(scene: THREE.Scene, windTorque: number) {
  const particleCount = 80;
  const particles: THREE.Mesh[] = [];
  const particleData: { velocity: THREE.Vector3; life: number; maxLife: number }[] = [];

  const particleGeometry = new THREE.SphereGeometry(0.015, 4, 4);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.6,
  });

  for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
    particle.visible = false;
    scene.add(particle);
    particles.push(particle);
    particleData.push({
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
    });
  }

  // Wind direction indicator (arrow)
  const arrowGroup = new THREE.Group();
  
  const arrowBodyGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
  const arrowHeadGeom = new THREE.ConeGeometry(0.05, 0.12, 8);
  const arrowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.8,
  });
  
  const arrowBody = new THREE.Mesh(arrowBodyGeom, arrowMaterial);
  arrowBody.rotation.z = Math.PI / 2;
  
  const arrowHead = new THREE.Mesh(arrowHeadGeom, arrowMaterial);
  arrowHead.rotation.z = -Math.PI / 2;
  arrowHead.position.x = 0.26;
  
  arrowGroup.add(arrowBody);
  arrowGroup.add(arrowHead);
  arrowGroup.position.set(-1.5, 0.5, -0.5);
  arrowGroup.rotation.y = Math.PI / 4; // Point toward door
  scene.add(arrowGroup);

  let frameCount = 0;

  const update = (delta: number, currentWindTorque: number) => {
    frameCount++;
    const windStrength = Math.abs(currentWindTorque) / 10;
    
    // Spawn new particles
    if (currentWindTorque > 0.1 && frameCount % 3 === 0) {
      for (let i = 0; i < particles.length; i++) {
        if (!particles[i].visible) {
          // Spawn from left side, moving right toward door
          particles[i].position.set(
            -2 + Math.random() * 0.3,
            0.2 + Math.random() * 0.8,
            -1 + Math.random() * 2
          );
          particles[i].visible = true;
          
          particleData[i].velocity.set(
            1.5 + Math.random() * windStrength,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.5
          );
          particleData[i].life = 0;
          particleData[i].maxLife = 1.5 + Math.random() * 0.5;
          break;
        }
      }
    }

    // Update particles
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].visible) {
        particleData[i].life += delta;
        
        if (particleData[i].life >= particleData[i].maxLife || particles[i].position.x > 1.5) {
          particles[i].visible = false;
          continue;
        }

        // Move particle
        particles[i].position.x += particleData[i].velocity.x * delta;
        particles[i].position.y += particleData[i].velocity.y * delta;
        particles[i].position.z += particleData[i].velocity.z * delta;

        // Fade out
        const lifeRatio = particleData[i].life / particleData[i].maxLife;
        (particles[i].material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - lifeRatio);
      }
    }

    // Animate arrow based on wind strength
    const scale = 0.5 + windStrength * 0.5;
    arrowGroup.scale.set(scale, scale, scale);
    arrowGroup.visible = currentWindTorque > 0.1;
    
    // Subtle oscillation
    arrowGroup.position.x = -1.5 + Math.sin(frameCount * 0.1) * 0.05;
  };

  const dispose = () => {
    particles.forEach(p => {
      scene.remove(p);
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    });
    scene.remove(arrowGroup);
    arrowGroup.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  };

  return { update, dispose };
}

export function WindIndicator({ windTorque }: { windTorque: number }) {
  const strength = Math.min(windTorque / 15, 1);
  
  return (
    <div className="absolute top-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border border-border/50">
      <div className="flex items-center gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              strength >= i / 3 ? 'bg-blue-500' : 'bg-muted'
            }`}
            style={{ height: `${8 + i * 4}px` }}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">
        Wind: {windTorque.toFixed(1)} N·m
      </span>
      <svg 
        className="w-4 h-4 text-blue-500 animate-pulse" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
        <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
        <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
      </svg>
    </div>
  );
}
