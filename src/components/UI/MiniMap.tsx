import React, { useState } from 'react';
import { Map, ChevronUp, ChevronDown } from 'lucide-react';

interface MiniMapProps {
  playerX: number;
  playerZ: number;
  playerYaw: number;
  visitedZones: string[];
}

export const MiniMap: React.FC<MiniMapProps> = ({
  playerX,
  playerZ,
  playerYaw
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Warehouse dimensions: X [-22, 22] (44m wide), Z [-20, 20] (40m long)
  // Map dimensions: 140px by 128px
  const mapW = 140;
  const mapH = 128;

  // Convert world X, Z to 2D canvas coordinates
  const normX = (playerX + 22) / 44;
  const normZ = (playerZ + 20) / 40;
  const posX = Math.max(6, Math.min(mapW - 6, normX * mapW));
  const posZ = Math.max(6, Math.min(mapH - 6, normZ * mapH));

  // Player rotation in degrees for directional marker
  const rotDeg = -(playerYaw * 180) / Math.PI;

  return (
    <div className="pointer-events-auto absolute top-20 right-4 md:right-6 select-none z-10 flex flex-col items-end">
      {/* MiniMap Container */}
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Map className="w-3 h-3 text-amber-400" />
            <span className="font-semibold text-zinc-200 uppercase tracking-wider">PLANO DE PLANTA</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* Map Canvas Content */}
        {!isCollapsed && (
          <div className="relative p-2">
            <svg
              width={mapW}
              height={mapH}
              className="bg-zinc-900/90 border border-zinc-800"
            >
              {/* Grid lines */}
              <line x1="0" y1={mapH / 2} x2={mapW} y2={mapH / 2} stroke="#27272a" strokeDasharray="3 3" />
              <line x1={mapW / 2} y1="0" x2={mapW / 2} y2={mapH} stroke="#27272a" strokeDasharray="3 3" />

              {/* Zone outlines */}
              {/* Racks Zone (West) */}
              <rect x="15" y="25" width="45" height="75" fill="#1e293b" fillOpacity="0.4" stroke="#334155" strokeWidth="1" />
              <text x="20" y="40" fill="#64748b" fontSize="7" fontFamily="monospace">RACKS</text>

              {/* Machinery Zone (East) */}
              <rect x="80" y="65" width="48" height="50" fill="#1e293b" fillOpacity="0.4" stroke="#334155" strokeWidth="1" />
              <text x="85" y="80" fill="#64748b" fontSize="7" fontFamily="monospace">MÁQUINAS</text>

              {/* Electrical Substation (Northwest) */}
              <rect x="15" y="10" width="35" height="22" fill="#451a03" fillOpacity="0.3" stroke="#b45309" strokeWidth="1" />
              <text x="18" y="22" fill="#d97706" fontSize="6" fontFamily="monospace">SUBESTACIÓN</text>

              {/* Loading Docks (North) */}
              <rect x="75" y="8" width="55" height="24" fill="#0f172a" fillOpacity="0.5" stroke="#334155" strokeWidth="1" />
              <text x="80" y="20" fill="#64748b" fontSize="6" fontFamily="monospace">ANDENES</text>

              {/* Evacuation Route (East edge) */}
              <line x1="132" y1="20" x2="132" y2="115" stroke="#16a34a" strokeWidth="2" strokeDasharray="4 2" />

              {/* Central Traffic Lane */}
              <line x1={mapW / 2} y1="15" x2={mapW / 2} y2={mapH - 15} stroke="#0284c7" strokeWidth="2" strokeOpacity="0.5" />

              {/* Player Icon Indicator with directional cone */}
              <g transform={`translate(${posX}, ${posZ}) rotate(${rotDeg})`}>
                {/* Field of vision cone */}
                <path d="M 0 0 L -12 -22 L 12 -22 Z" fill="#facc15" fillOpacity="0.25" />
                {/* Player dot */}
                <circle cx="0" cy="0" r="3.5" fill="#facc15" stroke="#18181b" strokeWidth="1.5" />
                {/* Heading needle */}
                <line x1="0" y1="0" x2="0" y2="-6" stroke="#facc15" strokeWidth="2" />
              </g>
            </svg>

            {/* Coordinates / Status footer */}
            <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-zinc-500">
              <span>X: {playerX.toFixed(1)}m</span>
              <span>Z: {playerZ.toFixed(1)}m</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
