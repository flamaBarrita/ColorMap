// components/ControlPanel.js
import React from 'react';

export default function ControlPanel({
  modo, setModo,
  numColores, setNumColores,
  velocidad, setVelocidad,
  animando, pausado, setPausado,
  onLoadExample, onClear, onSolve, onCancel,
  puntosCount
}) {
  return (
    // AUMENTADO PADDING Y GAP
    <div className="bg-gray-800 p-6 rounded-2xl shadow-xl h-fit flex flex-col gap-6 border border-gray-700">
      
      {/* Selector de Modo */}
      <div>
        <label className="block text-sm text-gray-400 uppercase font-bold mb-3 tracking-wider">Modo de Trabajo</label>
        <div className="flex bg-gray-700 rounded-lg p-1.5">
          <button onClick={() => setModo('voronoi')} className={`flex-1 py-2.5 text-sm font-medium rounded-md transition ${modo === 'voronoi' ? 'bg-blue-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Voronoi</button>
          <button onClick={() => setModo('grafo')} className={`flex-1 py-2.5 text-sm font-medium rounded-md transition ${modo === 'grafo' ? 'bg-blue-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Grafo Manual</button>
        </div>
      </div>

      {/* Configuración */}
      <div>
        <label className="block text-sm text-gray-400 uppercase font-bold mb-3 tracking-wider">Colores Permitidos (k={numColores})</label>
        <input type="range" min="2" max="5" value={numColores} onChange={(e) => setNumColores(parseInt(e.target.value))} className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
        <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
            <span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
      </div>

      {/* Acciones Básicas */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onLoadExample} disabled={animando} className="bg-purple-600 hover:bg-purple-700 py-3 rounded-lg text-sm font-semibold text-white transition">
            Cargar Ejemplo
        </button>
        <button onClick={onClear} disabled={animando} className="bg-gray-600 hover:bg-gray-700 py-3 rounded-lg text-sm font-semibold text-white transition">
            Limpiar
        </button>
      </div>

      <div className="h-px bg-gray-700"></div>

      {/* Botón Resolver / Detener */}
      {!animando ? (
        <button onClick={onSolve} disabled={puntosCount < 1} className="w-full py-4 rounded-xl font-bold text-xl shadow-lg bg-green-500 hover:bg-green-600 text-white transition disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]">
          ▶ Resolver con Backtracking
        </button>
      ) : (
        <button onClick={onCancel} className="w-full py-4 rounded-xl font-bold text-xl shadow-lg bg-red-500 hover:bg-red-600 text-white transition animate-pulse">
          ■ DETENER
        </button>
      )}

      {/* Controles de Animación */}
      <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700">
        <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Velocidad: {velocidad}ms</label>
        <input type="range" min="10" max="800" step="10" value={velocidad} onChange={(e) => setVelocidad(Number(e.target.value))} className="w-full accent-blue-500 mb-4"/>
        
        <button onClick={() => setPausado(!pausado)} disabled={!animando} className={`w-full py-3 rounded-lg font-bold text-sm text-white transition ${pausado ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50'}`}>
          {pausado ? "▶ REANUDAR" : "⏸ PAUSAR ANIMACIÓN"}
        </button>
      </div>
    </div>
  );
}