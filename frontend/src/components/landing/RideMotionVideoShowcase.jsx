import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, Zap, Moon, Sun, Camera, Shield, Navigation, Compass, Sparkles, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RideMotionVideoShowcase({ isCaptain = false }) {
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTurbo, setIsTurbo] = useState(false);
  const [isNight, setIsNight] = useState(true);
  const [cameraMode, setCameraMode] = useState('isometric'); // 'isometric', 'chase', 'top'
  const [currentSpeed, setCurrentSpeed] = useState(54);

  // References to keep animation state mutable across renders
  const animStateRef = useRef({
    isPlaying: true,
    isTurbo: false,
    speed: 0.8,
    wheels: [],
    buildings: [],
    roadDashes: [],
    streetLamps: [],
    carGroup: null,
    cameraMode: 'isometric',
    isNight: true
  });

  useEffect(() => {
    animStateRef.current.isPlaying = isPlaying;
    animStateRef.current.isTurbo = isTurbo;
    animStateRef.current.speed = isTurbo ? 2.0 : 0.8;
    animStateRef.current.cameraMode = cameraMode;
    animStateRef.current.isNight = isNight;
    setCurrentSpeed(isTurbo ? 92 : 54);
  }, [isPlaying, isTurbo, cameraMode, isNight]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer Setup
    const width = container.clientWidth || 540;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(7, 5, 8);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Clear previous canvas if any
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffd54f, 1.8);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const neonPointLight = new THREE.PointLight(0xffb300, 2.5, 12);
    neonPointLight.position.set(0, 2, 0);
    scene.add(neonPointLight);

    // 3. Highway / Road Mesh
    const roadWidth = 4.2;
    const roadLength = 60;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMat = new THREE.MeshStandardMaterial({ 
      color: 0x111622, 
      roughness: 0.6, 
      metalness: 0.2 
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);

    // Road Curbs / Sidewalks
    const curbGeo = new THREE.BoxGeometry(0.3, 0.15, roadLength);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-roadWidth / 2 - 0.15, 0.07, 0);
    scene.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(roadWidth / 2 + 0.15, 0.07, 0);
    scene.add(rightCurb);

    // Scrolling Road Dashes
    const roadDashes = [];
    const dashGeo = new THREE.PlaneGeometry(0.12, 1.2);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    for (let i = -roadLength / 2; i < roadLength / 2; i += 3.2) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.01, i);
      scene.add(dash);
      roadDashes.push(dash);
    }
    animStateRef.current.roadDashes = roadDashes;

    // 4. Build 3D RideX Stylized Yellow Taxi
    const carGroup = new THREE.Group();

    // Main Car Body (RideX Yellow)
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 3.2);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xffc727, 
      metalness: 0.4, 
      roughness: 0.3 
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    // Cabin / Windows (Tinted Black Glass)
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.55, 1.8);
    const cabinMat = new THREE.MeshStandardMaterial({ 
      color: 0x0f172a, 
      roughness: 0.1, 
      metalness: 0.9 
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.95, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Taxi Roof Sign ("RideX")
    const signGeo = new THREE.BoxGeometry(0.7, 0.22, 0.35);
    const signMat = new THREE.MeshStandardMaterial({ 
      color: 0xfffbeb, 
      emissive: 0xffb703, 
      emissiveIntensity: 0.8,
      roughness: 0.2 
    });
    const taxiSign = new THREE.Mesh(signGeo, signMat);
    taxiSign.position.set(0, 1.35, -0.2);
    carGroup.add(taxiSign);

    // Headlights
    const headlightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(-0.55, 0.55, 1.6);
    carGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(0.55, 0.55, 1.6);
    carGroup.add(rightHeadlight);

    // Headlight Light Beams
    const beamGeo = new THREE.ConeGeometry(0.8, 3.5, 16);
    const beamMat = new THREE.MeshBasicMaterial({ 
      color: 0xfef08a, 
      transparent: true, 
      opacity: 0.25 
    });
    
    const leftBeam = new THREE.Mesh(beamGeo, beamMat);
    leftBeam.rotation.x = Math.PI / 2.2;
    leftBeam.position.set(-0.55, 0.5, 3.2);
    carGroup.add(leftBeam);

    const rightBeam = new THREE.Mesh(beamGeo, beamMat);
    rightBeam.rotation.x = Math.PI / 2.2;
    rightBeam.position.set(0.55, 0.5, 3.2);
    carGroup.add(rightBeam);

    // Taillights
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const leftTaillight = new THREE.Mesh(headlightGeo, taillightMat);
    leftTaillight.position.set(-0.55, 0.55, -1.6);
    carGroup.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(headlightGeo, taillightMat);
    rightTaillight.position.set(0.55, 0.55, -1.6);
    carGroup.add(rightTaillight);

    // 4 Wheels
    const wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });

    const wheelPositions = [
      [-0.85, 0.35, 1.0],
      [0.85, 0.35, 1.0],
      [-0.85, 0.35, -1.0],
      [0.85, 0.35, -1.0]
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(x, y, z);

      const tire = new THREE.Mesh(wheelGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelHub.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelHub.add(rim);

      carGroup.add(wheelHub);
      wheels.push(wheelHub);
    });

    carGroup.position.set(0, 0, 0);
    scene.add(carGroup);
    animStateRef.current.carGroup = carGroup;
    animStateRef.current.wheels = wheels;

    // 5. 3D City Buildings along the Highway
    const buildings = [];
    const buildingColors = [0x1e293b, 0x0f172a, 0x334155, 0x1e1b4b];
    const windowColors = [0x38bdf8, 0xfacc15, 0x34d399, 0xa855f7];

    for (let i = -24; i < 24; i += 4.5) {
      // Left side buildings
      const hL = 3 + Math.random() * 6;
      const bL = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, hL, 2.8),
        new THREE.MeshStandardMaterial({ 
          color: buildingColors[Math.floor(Math.random() * buildingColors.length)], 
          roughness: 0.4, 
          metalness: 0.5 
        })
      );
      bL.position.set(-5.5 - Math.random() * 2, hL / 2, i);
      bL.castShadow = true;
      bL.receiveShadow = true;
      scene.add(bL);
      buildings.push(bL);

      // Right side buildings
      const hR = 3 + Math.random() * 6;
      const bR = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, hR, 2.8),
        new THREE.MeshStandardMaterial({ 
          color: buildingColors[Math.floor(Math.random() * buildingColors.length)], 
          roughness: 0.4, 
          metalness: 0.5 
        })
      );
      bR.position.set(5.5 + Math.random() * 2, hR / 2, i);
      bR.castShadow = true;
      bR.receiveShadow = true;
      scene.add(bR);
      buildings.push(bR);
    }
    animStateRef.current.buildings = buildings;

    // 6. Floating 3D GPS Location Marker Pin
    const pinGroup = new THREE.Group();
    const pinHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6 })
    );
    const pinCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.7, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981 })
    );
    pinCone.rotation.x = Math.PI;
    pinCone.position.y = -0.4;
    pinGroup.add(pinHead);
    pinGroup.add(pinCone);
    pinGroup.position.set(1.5, 2.8, 4.5);
    scene.add(pinGroup);

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const state = animStateRef.current;

      if (state.isPlaying) {
        const moveSpeed = state.speed * 12 * delta;

        // Animate road dashes
        state.roadDashes.forEach(dash => {
          dash.position.z -= moveSpeed;
          if (dash.position.z < -roadLength / 2) {
            dash.position.z += roadLength;
          }
        });

        // Animate buildings scrolling by
        state.buildings.forEach(b => {
          b.position.z -= moveSpeed;
          if (b.position.z < -28) {
            b.position.z += 56;
          }
        });

        // Spin wheels
        state.wheels.forEach(w => {
          w.rotation.x += moveSpeed * 3;
        });

        // Car Body subtle bounce & sway
        if (state.carGroup) {
          const time = clock.getElapsedTime();
          state.carGroup.position.y = Math.sin(time * 12) * 0.02;
          state.carGroup.rotation.z = Math.sin(time * 6) * 0.015;
          state.carGroup.rotation.y = Math.sin(time * 3) * 0.02;
        }

        // Floating GPS Pin bobbing
        if (pinGroup) {
          const time = clock.getElapsedTime();
          pinGroup.position.y = 2.4 + Math.sin(time * 4) * 0.25;
          pinGroup.rotation.y += 0.03;
        }
      }

      // Camera Modes
      if (state.cameraMode === 'isometric') {
        camera.position.lerp(new THREE.Vector3(6.5, 4.8, 7.5), 0.05);
        camera.lookAt(0, 0.6, 0);
      } else if (state.cameraMode === 'chase') {
        camera.position.lerp(new THREE.Vector3(0, 2.2, -5.5), 0.05);
        camera.lookAt(0, 0.8, 6);
      } else if (state.cameraMode === 'top') {
        camera.position.lerp(new THREE.Vector3(0, 10, 1), 0.05);
        camera.lookAt(0, 0, 1);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Resizing
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-slate-950 group">
      
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-[320px] sm:h-[380px] bg-slate-950 cursor-grab active:cursor-grabbing"
      />

      {/* Top 3D Control Bar & Live Telemetry HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        
        {/* Live Speedometer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-amber-500/30 text-white shadow-lg pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <div className="flex items-center gap-1.5 text-xs font-black">
            <span className="text-amber-400">3D RideX</span>
            <span className="text-slate-400">•</span>
            <span className={`font-mono transition-colors ${isTurbo ? 'text-amber-400 font-extrabold' : 'text-emerald-400'}`}>
              {currentSpeed} KM/H
            </span>
          </div>
        </div>

        {/* 3D Interactive Controls: Camera Angles, Turbo, Play/Pause */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          
          {/* Camera View Switcher */}
          <button
            onClick={() => {
              const modes = ['isometric', 'chase', 'top'];
              const nextIndex = (modes.indexOf(cameraMode) + 1) % modes.length;
              setCameraMode(modes[nextIndex]);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 backdrop-blur-md border border-white/10 text-[11px] font-bold text-slate-200 hover:text-amber-400 transition-all shadow-md flex items-center gap-1 cursor-pointer"
            title="Switch 3D Camera Angle"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="capitalize hidden sm:inline">{cameraMode} 3D</span>
          </button>

          {/* Turbo Boost */}
          <button
            onClick={() => setIsTurbo(!isTurbo)}
            className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-[11px] font-black transition-all shadow-md flex items-center gap-1 cursor-pointer ${
              isTurbo 
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50' 
                : 'bg-slate-950/85 hover:bg-slate-900 border-white/10 text-slate-200 hover:text-amber-400'
            }`}
            title="Toggle Turbo Speed"
          >
            <Zap className={`w-3.5 h-3.5 ${isTurbo ? 'fill-slate-950 animate-bounce' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">{isTurbo ? 'TURBO ON' : 'Boost'}</span>
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-slate-950/85 hover:bg-slate-900 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
            title={isPlaying ? "Pause 3D Animation" : "Play 3D Animation"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
          </button>
        </div>

      </div>

    </div>
  );
}