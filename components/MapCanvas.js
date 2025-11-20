// components/MapCanvas.js
import React, { useRef } from 'react';
import { generarPoligonosVoronoi } from '../utils/mapHelpers';

export default function MapCanvas({ 
  modo, 
  puntos, 
  enlaces, 
  coloresRegiones, 
  historialPasos, 
  pasoActual, 
  nodoSeleccionado, 
  onCanvasClick, 
  onNodeClick,
  animando 
}) {
  const svgRef = useRef(null);
  
  // --- CORRECCIÓN: Solo calculamos Voronoi si estamos en ese modo ---
  const poligonos = modo === 'voronoi' ? generarPoligonosVoronoi(props.puntos) : [];

  const descargarSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mapa_coloreado.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl relative h-[600px] border-4 border-gray-800">
      
      {/* Instrucciones flotantes */}
      {!animando && (
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-sm z-10 pointer-events-none">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">
            MODO: <span className="text-blue-600">{modo.toUpperCase()}</span>
          </p>
          {modo === 'voronoi' ? (
            <p className="text-sm text-gray-700">🖱 Clic para crear regiones.</p>
          ) : (
            <div className="text-sm text-gray-700 space-y-1">
              <p>🔵 <b>Clic vacío:</b> Crear Nodo</p>
              <p>🔗 <b>Clic en 2 Nodos:</b> Conectar</p>
            </div>
          )}
        </div>
      )}

      <svg 
        ref={svgRef}
        width="100%" height="100%" viewBox="0 0 600 400" 
        onClick={onCanvasClick}
        className={`w-full h-full bg-gray-100 ${animando ? 'cursor-default' : 'cursor-crosshair'}`}
      >
        {/* --- CAPA VORONOI (Solo si modo == voronoi) --- */}
        {modo === 'voronoi' && poligonos.map((poly) => {
          const isCurrent = historialPasos[pasoActual]?.node == poly.id.toString();
          const color = coloresRegiones[poly.id] || '#ffffff';
          return (
            <g key={poly.id}>
              <path 
                d={poly.path} 
                fill={color} 
                stroke={isCurrent ? '#000' : '#9ca3af'} 
                strokeWidth={isCurrent ? 3 : 1}
              />
              <circle cx={poly.cx} cy={poly.cy} r="2" fill="#000" opacity="0.2" />
              <text x={poly.cx} y={poly.cy} fontSize="10" className="select-none opacity-40 pointer-events-none">
                {poly.id}
              </text>
            </g>
          );
        })}

        {/* --- CAPA GRAFO (Solo si modo == grafo) --- */}
        {modo === 'grafo' && (
          <>
            {enlaces.map((link, i) => {
              const p1 = puntos[link[0]];
              const p2 = puntos[link[1]];
              return <line key={i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke="#94a3b8" strokeWidth="3" />;
            })}
            {puntos.map((p, i) => {
              const isCurrent = historialPasos[pasoActual]?.node == i.toString();
              const isSelected = nodoSeleccionado === i;
              const color = coloresRegiones[i] || '#e2e8f0';
              return (
                <g key={i} onClick={(e) => onNodeClick(e, i)}>
                  <circle 
                    cx={p[0]} cy={p[1]} r="18" fill={color}
                    stroke={isSelected ? '#F59E0B' : (isCurrent ? '#000' : '#475569')}
                    strokeWidth={isSelected ? 4 : (isCurrent ? 3 : 2)}
                    className="cursor-pointer hover:opacity-90 transition-all shadow-md"
                  />
                  <text x={p[0]} y={p[1]} dy=".3em" textAnchor="middle" fontSize="14" className="pointer-events-none font-bold text-gray-700">{i}</text>
                </g>
              );
            })}
          </>
        )}
      </svg>

      <div className="absolute bottom-3 right-3">
        <button onClick={descargarSVG} className="bg-white hover:bg-blue-50 text-blue-600 px-4 py-2 rounded shadow-lg text-sm font-bold border border-blue-200 transition transform hover:scale-105">
          ⬇ Descargar SVG
        </button>
      </div>
    </div>
  );
}