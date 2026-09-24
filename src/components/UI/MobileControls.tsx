import React, { useRef, useState } from 'react';
import { PlayerController, RaycastHitResult } from '../3d/PlayerController';
import { CheckCircle2 } from 'lucide-react';

interface MobileControlsProps {
  playerController: PlayerController | null;
  raycastHit: RaycastHitResult;
  onTriggerInspection: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  playerController,
  raycastHit,
  onTriggerInspection
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const prevLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Joystick touch handlers
  const handleJoyStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoyMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleJoyEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setKnobPos({ x: 0, y: 0 });
        if (playerController) {
          playerController.mobileMoveX = 0;
          playerController.mobileMoveY = 0;
        }
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current || !playerController) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 10;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });

    // Normalized to -1..1
    playerController.mobileMoveX = dx / maxRadius;
    playerController.mobileMoveY = dy / maxRadius;
  };

  // Touch look handlers on right side of screen
  const handleLookStart = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    prevLookPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        const touch = e.changedTouches[i];
        const dx = touch.clientX - prevLookPos.current.x;
        const dy = touch.clientY - prevLookPos.current.y;
        prevLookPos.current = { x: touch.clientX, y: touch.clientY };

        if (playerController) {
          playerController.applyTouchLook(dx, dy);
        }
        break;
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  };

  return (
    <div className="md:hidden pointer-events-none fixed inset-0 z-20 flex select-none">
      {/* Left side: Virtual Movement Joystick */}
      <div className="w-1/2 h-full flex items-end p-6 pointer-events-auto">
        <div
          ref={joystickRef}
          onTouchStart={handleJoyStart}
          onTouchMove={handleJoyMove}
          onTouchEnd={handleJoyEnd}
          onTouchCancel={handleJoyEnd}
          className="relative w-32 h-32 rounded-full border-2 border-zinc-700 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center shadow-lg"
        >
          {/* Joystick Base cross guides */}
          <div className="absolute w-full h-[1px] bg-zinc-800" />
          <div className="absolute h-full w-[1px] bg-zinc-800" />

          {/* Draggable Knob */}
          <div
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`
            }}
            className="w-14 h-14 rounded-full bg-amber-500/90 border-2 border-amber-300 shadow-md flex items-center justify-center text-[10px] font-bold text-zinc-950 uppercase"
          >
            Mover
          </div>
        </div>
      </div>

      {/* Right side: Look Touchpad & Quick Action Button */}
      <div
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
        className="w-1/2 h-full flex flex-col justify-end items-end p-6 pointer-events-auto"
      >
        {raycastHit.canInspect && (
          <button
            onClick={onTriggerInspection}
            className="mb-6 p-4 rounded-full bg-amber-500 text-zinc-950 font-bold border-2 border-amber-300 shadow-xl flex items-center justify-center animate-bounce"
          >
            <CheckCircle2 className="w-8 h-8" />
          </button>
        )}

        <div className="text-[10px] font-mono text-zinc-500 bg-zinc-950/70 px-3 py-1 border border-zinc-800">
          DESLIZA AQUÍ PARA MIRAR
        </div>
      </div>
    </div>
  );
};
