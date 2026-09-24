import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CollisionSystem } from './components/3d/CollisionSystem';
import { WarehouseScene } from './components/3d/WarehouseScene';
import { PlayerController, RaycastHitResult } from './components/3d/PlayerController';
import { hazardEngine } from './services/hazardEngine';
import { firebaseService } from './services/firebase';
import { audioEngine } from './services/audioEngine';
import { HazardDefinition } from './types/Hazard';
import { InspectionSession } from './types/Session';

// UI Components
import { HUD } from './components/UI/HUD';
import { MiniMap } from './components/UI/MiniMap';
import { HazardDialog } from './components/UI/HazardDialog';
import { PauseMenu } from './components/UI/PauseMenu';
import { ResultsModal } from './components/UI/ResultsModal';
import { StartScreen } from './components/UI/StartScreen';
import { MobileControls } from './components/UI/MobileControls';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // App & Inspection Flow States
  const [gameState, setGameState] = useState<'briefing' | 'inspecting' | 'paused' | 'results'>('briefing');
  const [participantName, setParticipantName] = useState('Ing. Carlos Valdés');
  const [companyName, setCompanyName] = useState('Logística & Manufactura Norte');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(600);

  // 3D Engine References
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<WarehouseScene | null>(null);
  const collisionRef = useRef<CollisionSystem | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Real-time Telemetry States
  const [playerCoords, setPlayerCoords] = useState<{ x: number; z: number; yaw: number }>({ x: 0, z: 14, yaw: 0 });
  const [currentZoneName, setCurrentZoneName] = useState('Zona 1: Recepción de Materiales');
  const [visitedZones, setVisitedZones] = useState<string[]>([]);
  const [raycastHit, setRaycastHit] = useState<RaycastHitResult>({
    hazard: null,
    distance: 0,
    canInspect: false,
    message: ''
  });

  // Scoring & Hazards Progress
  const [activeHazards, setActiveHazards] = useState<HazardDefinition[]>([]);
  const [foundCount, setFoundCount] = useState(0);
  const [score, setScore] = useState(0);
  const [currentInspectingHazard, setCurrentInspectingHazard] = useState<HazardDefinition | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [completedSession, setCompletedSession] = useState<InspectionSession | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const elapsedSecondsRef = useRef<number>(0);

  // Determine current warehouse zone from X, Z coordinates
  const calculateZone = useCallback((x: number, z: number): { id: string; name: string } => {
    if (x > 17 && z > -2 && z < 16) {
      return { id: 'Z7', name: 'Zona 7: Ruta de Evacuación' };
    }
    if (x < -6 && z < -8) {
      return { id: 'Z5', name: 'Zona 5: Área Eléctrica y Subestación' };
    }
    if (x > 6 && z < -7) {
      return { id: 'Z6', name: 'Zona 6: Zona de Carga y Descarga' };
    }
    if (x > 5 && z >= -2) {
      return { id: 'Z4', name: 'Zona 4: Área de Maquinaria y Producción' };
    }
    if (x < -2 && z >= -8 && z <= 12) {
      return { id: 'Z2', name: 'Zona 2: Almacenamiento en Racks' };
    }
    if (Math.abs(x) <= 4 && z <= 5) {
      return { id: 'Z3', name: 'Zona 3: Circulación de Montacargas' };
    }
    return { id: 'Z1', name: 'Zona 1: Recepción de Materiales' };
  }, []);

  // Initialize 3D Engine
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. WebGL Renderer with High Performance & Antialiasing
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Clear previous canvas if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Camera: 75 FOV, near 0.1, far 100
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);

    // 3. Collision Engine
    const collision = new CollisionSystem();
    collisionRef.current = collision;

    // 4. Industrial Warehouse Scene
    const warehouse = new WarehouseScene(collision);
    warehouse.initPostProcessing(renderer, camera, width, height);
    sceneRef.current = warehouse;

    // 5. Player First Person Controller
    const playerController = new PlayerController(camera, renderer.domElement, collision);
    playerControllerRef.current = playerController;

    // Resize handler
    const handleResize = () => {
      if (!canvasContainerRef.current || !rendererRef.current) return;
      const w = canvasContainerRef.current.clientWidth;
      const h = canvasContainerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      warehouse.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Keyboard ESC for Pause
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setGameState(prev => {
          if (prev === 'inspecting') {
            playerController.unlock();
            return 'paused';
          }
          if (prev === 'paused') {
            playerController.requestLock();
            return 'inspecting';
          }
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Render & Physics Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (playerControllerRef.current && sceneRef.current) {
        // Update physics & camera only when in active inspection mode
        const hit = playerControllerRef.current.update(delta);
        setRaycastHit(hit);

        const pos = playerControllerRef.current.position;
        const yaw = playerControllerRef.current.getYaw();
        setPlayerCoords({ x: pos.x, z: pos.z, yaw });

        // Update zone
        const zone = calculateZone(pos.x, pos.z);
        setCurrentZoneName(zone.name);
        hazardEngine.recordVisitedZone(zone.id);
        setVisitedZones(hazardEngine.getVisitedZones());
      }

      warehouse.render(renderer, camera, delta);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      warehouse.dispose();
      playerController.dispose();
      renderer.dispose();
    };
  }, [calculateZone]);

  // Inspection Timer Effect
  useEffect(() => {
    if (gameState !== 'inspecting') return;
    const interval = setInterval(() => {
      elapsedSecondsRef.current += 1;
      if (timeLimitMinutes > 0) {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            // Time expired! Conclude inspection
            finishInspection();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timeLimitMinutes]);

  // Conclude inspection session & generate audit certificate
  const finishInspection = useCallback(async () => {
    playerControllerRef.current?.unlock();
    const user = await firebaseService.getCurrentUser();
    const session = hazardEngine.generateSessionSummary(
      user.uid,
      participantName,
      companyName,
      user.puesto,
      startTimeRef.current,
      timeLimitMinutes * 60,
      elapsedSecondsRef.current
    );
    await firebaseService.saveSession(session);
    setCompletedSession(session);
    setGameState('results');
    audioEngine.playSuccess();
  }, [participantName, companyName, timeLimitMinutes]);

  // Start Inspection handler
  const handleStartInspection = (name: string, company: string, limitMinutes: number) => {
    setParticipantName(name);
    setCompanyName(company);
    setTimeLimitMinutes(limitMinutes);
    setTimeRemainingSeconds(limitMinutes > 0 ? limitMinutes * 60 : 0);
    elapsedSecondsRef.current = 0;
    startTimeRef.current = Date.now();

    // Pick 12 random hazards for inspection
    const hazards = hazardEngine.initSession(12);
    setActiveHazards(hazards);
    setFoundCount(0);
    setScore(0);
    playerControllerRef.current?.setHazards(hazards);

    // Reset player position to Reception aisle
    playerControllerRef.current?.setPosition(0, 0, 14);

    setGameState('inspecting');
    playerControllerRef.current?.requestLock();
  };

  // Trigger inspection on currently targeted hazard
  const handleTriggerInspection = () => {
    if (raycastHit.canInspect && raycastHit.hazard) {
      audioEngine.playInspectPrompt();
      playerControllerRef.current?.unlock();
      setCurrentInspectingHazard(raycastHit.hazard);
    }
  };

  // Close Hazard Dialog after evaluation
  const handleCloseHazardDialog = (pointsGained: number) => {
    setCurrentInspectingHazard(null);
    setFoundCount(hazardEngine.getIdentifiedCount());
    setScore(hazardEngine.getTotalScore());

    // Check if all hazards in the session have been identified
    if (hazardEngine.getIdentifiedCount() >= hazardEngine.getTotalHazardsCount()) {
      finishInspection();
    } else {
      playerControllerRef.current?.requestLock();
    }
  };

  const handleToggleSound = () => {
    const muted = audioEngine.toggleMute();
    setIsSoundMuted(muted);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
      />

      {/* In-Game Heads Up Display (HUD) */}
      {gameState === 'inspecting' && (
        <>
          <HUD
            moduleName="CACERÍA DE PELIGROS"
            foundCount={foundCount}
            totalCount={activeHazards.length}
            score={score}
            timeRemainingSeconds={timeRemainingSeconds}
            isUnlimitedTime={timeLimitMinutes === 0}
            isSoundMuted={isSoundMuted}
            onToggleSound={handleToggleSound}
            onOpenPauseMenu={() => {
              playerControllerRef.current?.unlock();
              setGameState('paused');
            }}
            currentZoneName={currentZoneName}
            raycastHit={raycastHit}
            onTriggerInspection={handleTriggerInspection}
            isInspecting={currentInspectingHazard !== null}
          />

          {/* Radar MiniMap */}
          <MiniMap
            playerX={playerCoords.x}
            playerZ={playerCoords.z}
            playerYaw={playerCoords.yaw}
            visitedZones={visitedZones}
          />

          {/* Virtual Mobile Joystick & Look Controls */}
          <MobileControls
            playerController={playerControllerRef.current}
            raycastHit={raycastHit}
            onTriggerInspection={handleTriggerInspection}
          />
        </>
      )}

      {/* Hazard Inspection Wizard Modal */}
      {currentInspectingHazard && (
        <HazardDialog
          hazard={currentInspectingHazard}
          onClose={handleCloseHazardDialog}
        />
      )}

      {/* Briefing Start Screen */}
      {gameState === 'briefing' && (
        <StartScreen onStartInspection={handleStartInspection} />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseMenu
          onResume={() => {
            setGameState('inspecting');
            playerControllerRef.current?.requestLock();
          }}
          onRestart={() => {
            handleStartInspection(participantName, companyName, timeLimitMinutes);
          }}
          onExitToMenu={() => {
            setGameState('briefing');
          }}
          timeLimitMinutes={timeLimitMinutes}
          onUpdateTimer={mins => {
            setTimeLimitMinutes(mins);
            setTimeRemainingSeconds(mins > 0 ? mins * 60 : 0);
          }}
        />
      )}

      {/* Results and Certification Audit Modal */}
      {gameState === 'results' && completedSession && (
        <ResultsModal
          session={completedSession}
          onRestart={() => {
            handleStartInspection(participantName, companyName, timeLimitMinutes);
          }}
          onExit={() => {
            setGameState('briefing');
          }}
        />
      )}
    </main>
  );
}
