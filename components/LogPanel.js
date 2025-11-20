import React, { useEffect, useRef } from 'react';

// DICCIONARIO DE TRADUCCIÓN (Hex -> Nombre)
const NOMBRES_COLORES = {
  '#EF4444': 'Rojo',
  '#3B82F6': 'Azul',
  '#10B981': 'Verde',
  '#F59E0B': 'Amarillo',
  '#8B5CF6': 'Violeta'
};

export default function LogPanel({ historialPasos, pasoActual, mensajeEstado }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pasoActual]);

  return (
    <div className="bg-gray-800 p-0 rounded-2xl shadow-xl flex flex-col h-[600px] border border-gray-700 overflow-hidden">
      <div className="bg-gray-900/50 p-4 border-b border-gray-700">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Log de Ejecución</h3>
      </div>
      
      <div className="flex-1 bg-gray-900/80 overflow-y-auto p-3 space-y-2 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-700">
        {historialPasos.length === 0 && (
            <div className="flex h-full items-center justify-center text-gray-600 italic">
                Esperando iniciar...
            </div>
        )}
        
        {historialPasos.map((paso, index) => {
          const esActual = index === pasoActual;
          let colorCSS = "text-gray-400"; // Color del texto del log general
          let bg = "bg-transparent";
          let icon = "•";
          
          // Traducir el código HEX a Nombre Humano
          // Si por alguna razón llega un color raro, muestra el Hex original
          const nombreColor = NOMBRES_COLORES[paso.color] || paso.color;

          if (paso.type === 'assign') { colorCSS = "text-green-400"; icon="✓"; }
          if (paso.type === 'backtrack') { colorCSS = "text-red-400"; icon="↺"; }
          if (paso.type === 'try') { colorCSS = "text-blue-300"; icon="?"; }
          
          if (esActual) bg = "bg-gray-700 border-l-4 border-blue-500 pl-2";

          return (
            <div key={index} className={`py-1 px-2 rounded transition-all ${bg} ${colorCSS} flex items-start gap-2`}>
              <span className="opacity-50 text-xs mt-1 min-w-[24px]">#{index+1}</span>
              <div>
                 <span className="mr-2 font-bold">{icon}</span>
                 
                 {paso.type === 'try' && (
                   <span>
                     Probando <b style={{color: paso.color}}>{nombreColor}</b> en Nodo {paso.node}
                   </span>
                 )}
                 
                 {paso.type === 'assign' && (
                   <span>
                     Asignado <b style={{color: paso.color}}>{nombreColor}</b> a Nodo {paso.node}
                   </span>
                 )}
                 
                 {paso.type === 'backtrack' && (
                   <span>
                     Conflicto en Nodo {paso.node}. <b>Retrocediendo.</b>
                   </span>
                 )}
              </div>
            </div>
          )
        })}
        <div ref={logEndRef} />
      </div>
      
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-1 uppercase font-bold">Estado del Sistema</p>
        <p className="font-mono text-yellow-400 text-sm truncate animate-pulse-slow">
            {mensajeEstado}
        </p>
      </div>
    </div>
  );
}