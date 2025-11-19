import React, { useState, useEffect, useRef } from 'react';
import { Delaunay } from 'd3-delaunay';

// --- CONFIGURACIÓN ---
const API_URL = '/api/solve'; // O 'http://localhost:3001/solve' si usas servidor separado
const COLORES_DISPONIBLES = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']; // Rojo, Azul, Verde, Amarillo, Violeta

export default function MapColoringApp() {
  // --- ESTADOS ---
  const [puntos, setPuntos] = useState([]); // Coordenadas [x,y] de las regiones
  const [numColores, setNumColores] = useState(3);
  const [historialPasos, setHistorialPasos] = useState([]); // Log que viene del backend
  const [pasoActual, setPasoActual] = useState(0); // Índice de la animación
  const [coloresRegiones, setColoresRegiones] = useState({}); // Estado visual actual {nodoId: color}
  const [animando, setAnimando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState("Dibuja regiones haciendo click o carga un mapa.");

  // Referencia para el scroll del log
  const logEndRef = useRef(null);

  // --- LÓGICA DE VORONOI Y GRAFO ---
  // Calculamos los polígonos de Voronoi cada vez que cambian los puntos
  const generarPoligonos = () => {
    if (puntos.length < 1) return [];
    const delaunay = Delaunay.from(puntos);
    const voronoi = delaunay.voronoi([0, 0, 600, 400]); // Tamaño del canvas
    return puntos.map((_, i) => ({
      id: i,
      path: voronoi.renderCell(i),
      cx: puntos[i][0],
      cy: puntos[i][1]
    }));
  };

  // Extraer grafo de vecindad para enviar al backend
  const extraerAdyacencia = () => {
    if (puntos.length < 1) return {};
    const delaunay = Delaunay.from(puntos);
    const adyacencia = {};
    for (let i = 0; i < puntos.length; i++) {
      adyacencia[i] = [];
      const neighbors = delaunay.neighbors(i);
      for (const n of neighbors) {
        adyacencia[i].push(n.toString());
      }
    }
    return adyacencia;
  };

  // --- MANEJADORES DE EVENTOS ---

  const agregarPunto = (e) => {
    if (animando) return;
    const svgRect = e.target.closest('svg').getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    setPuntos([...puntos, [x, y]]);
    setMensajeEstado("Región agregada. Agrega más o pulsa 'Resolver'.");
  };

  const cargarMapaEjemplo = () => {
    // Un patrón predefinido interesante
    setPuntos([
      [100, 100], [200, 100], [300, 100],
      [150, 200], [250, 200],
      [100, 300], [200, 300], [300, 300]
    ]);
    resetearSolucion();
    setMensajeEstado("Mapa de ejemplo cargado.");
  };

  const resetearSolucion = () => {
    setHistorialPasos([]);
    setPasoActual(0);
    setColoresRegiones({});
    setAnimando(false);
  };

  // --- LLAMADA AL BACKEND ---
  const resolverMapa = async () => {
    if (puntos.length < 2) {
      alert("Necesitas dibujar al menos 2 regiones.");
      return;
    }

    resetearSolucion();
    setMensajeEstado("Calculando solución con Backtracking...");

    const adyacencia = extraerAdyacencia();
    // Seleccionamos solo los colores que pidió el usuario
    const paleta = COLORES_DISPONIBLES.slice(0, numColores);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjacency: adyacencia, colors: paleta }),
      });
      
      const data = await res.json();

      if (data.steps) {
        setHistorialPasos(data.steps);
        setAnimando(true); // Iniciar animación
        setMensajeEstado("Visualizando proceso...");
      } else {
        setMensajeEstado("Error al recibir pasos del servidor.");
      }
    } catch (error) {
      console.error(error);
      setMensajeEstado("Error de conexión con el Backend.");
    }
  };

  // --- MOTOR DE ANIMACIÓN ---
  useEffect(() => {
    let intervalo;
    if (animando && pasoActual < historialPasos.length) {
      intervalo = setTimeout(() => {
        const paso = historialPasos[pasoActual];
        
        // Actualizar visualización según el paso
        if (paso.type === 'assign') {
          setColoresRegiones(prev => ({ ...prev, [paso.node]: paso.color }));
        } else if (paso.type === 'backtrack') {
          setColoresRegiones(prev => {
            const copia = { ...prev };
            delete copia[paso.node]; // Quitar color visualmente
            return copia;
          });
        }
        // Si es 'try', podríamos poner un borde o color temporal, 
        // pero para simplificar dejamos que pase al siguiente frame rápido.

        setPasoActual(prev => prev + 1);
      }, 200); // Velocidad en ms (ajustable)
    } else if (pasoActual >= historialPasos.length && historialPasos.length > 0) {
      setAnimando(false);
      setMensajeEstado("¡Proceso finalizado!");
    }
    return () => clearTimeout(intervalo);
  }, [animando, pasoActual, historialPasos]);

  // Auto-scroll del log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pasoActual]);

  // --- RENDERIZADO ---
  const poligonos = generarPoligonos();

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Visualizador de Backtracking: Coloreo de Mapas</h1>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL IZQUIERDO: CONTROLES */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg h-fit">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Configuración</h2>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Número de Colores (k)</label>
            <input 
              type="number" 
              min="2" max="5" 
              value={numColores}
              onChange={(e) => setNumColores(parseInt(e.target.value))}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={cargarMapaEjemplo} disabled={animando} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition text-sm">
              📂 Cargar Mapa Ejemplo
            </button>
            <button onClick={() => setPuntos([])} disabled={animando} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition text-sm">
              🗑️ Limpiar Mapa
            </button>
            <div className="h-px bg-gray-700 my-2"></div>
            <button 
              onClick={resolverMapa} 
              disabled={animando || puntos.length < 1}
              className={`px-4 py-3 rounded font-bold text-lg shadow-lg transition
                ${animando ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {animando ? 'Procesando...' : '▶ Resolver con Backtracking'}
            </button>
          </div>

          <div className="mt-6 p-3 bg-gray-700/50 rounded text-sm">
            <p className="text-gray-300">Estado:</p>
            <p className="font-mono text-yellow-400">{mensajeEstado}</p>
          </div>
        </div>

        {/* PANEL CENTRAL: VISUALIZACIÓN DEL MAPA */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white rounded-xl overflow-hidden shadow-2xl relative" style={{ height: '400px' }}>
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 600 400" 
              onClick={agregarPunto}
              className="cursor-crosshair"
            >
              {poligonos.map((poly) => {
                // Determinar color de relleno
                // Si el paso actual está intentando ('try') este nodo, usar un color claro temporal
                const isCurrentNode = historialPasos[pasoActual]?.node == poly.id.toString();
                const stepType = historialPasos[pasoActual]?.type;
                
                let fillColor = coloresRegiones[poly.id] || '#f3f4f6'; // Gris por defecto
                let strokeColor = '#374151';
                let strokeWidth = 1;

                // Resaltar nodo activo en la animación
                if (isCurrentNode) {
                  strokeColor = '#000';
                  strokeWidth = 3;
                  if (stepType === 'backtrack') fillColor = '#fca5a5'; // Flash rojo suave al retroceder
                }

                return (
                  <g key={poly.id}>
                    <path 
                      d={poly.path} 
                      fill={fillColor} 
                      stroke={strokeColor} 
                      strokeWidth={strokeWidth}
                      className="transition-colors duration-200"
                    />
                    <circle cx={poly.cx} cy={poly.cy} r="3" fill="black" opacity="0.3" />
                    <text x={poly.cx} y={poly.cy} fontSize="10" className="select-none opacity-50">
                      R{poly.id}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="absolute top-2 right-2 bg-white/80 text-black text-xs px-2 py-1 rounded">
              {puntos.length} Regiones
            </div>
          </div>
        </div>

        {/* PANEL INFERIOR: LOG DE PASOS (Full Width en móvil, col-span-3 en desktop) */}
        <div className="lg:col-span-3 bg-gray-800 p-4 rounded-xl shadow-lg max-h-60 flex flex-col">
          <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Traza de Ejecución (Paso a Paso)
          </h3>
          <div className="flex-1 overflow-y-auto font-mono text-sm space-y-1 bg-gray-900 p-3 rounded border border-gray-700">
            {historialPasos.length === 0 && (
              <span className="text-gray-600 italic">Esperando ejecución...</span>
            )}
            
            {historialPasos.map((paso, index) => {
              // Estilos según el tipo de paso
              let colorTexto = "text-gray-400";
              let icono = "•";
              if (paso.type === 'assign') { colorTexto = "text-green-400"; icono = "✓"; }
              if (paso.type === 'backtrack') { colorTexto = "text-red-400"; icono = "↺"; }
              if (paso.type === 'try') { colorTexto = "text-blue-300"; icono = "?"; }

              // Resaltar la línea actual
              const esActual = index === pasoActual;
              const bgClass = esActual ? "bg-gray-700" : "";

              return (
                <div key={index} className={`flex items-center gap-2 px-2 py-0.5 rounded ${bgClass} ${colorTexto}`}>
                  <span className="w-4">{icono}</span>
                  <span className="font-bold">Paso {index + 1}:</span>
                  <span>
                    {paso.type === 'try' && `Probando color ${paso.color} en Región ${paso.node}...`}
                    {paso.type === 'assign' && `¡Éxito! Asignado ${paso.color} a Región ${paso.node}.`}
                    {paso.type === 'backtrack' && `Conflicto/Sin opciones en R${paso.node}. Retrocediendo (Backtracking).`}
                  </span>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}