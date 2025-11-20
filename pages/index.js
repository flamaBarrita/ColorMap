// pages/index.js
import React, { useState, useEffect } from 'react';
//import '../styles/globals.css';

// Importar nuestros módulos
import MapCanvas from '../components/MapCanvas';
import ControlPanel from '../components/ControlPanel';
import LogPanel from '../components/LogPanel';
import { construirAdyacencia } from '../utils/mapHelpers';

// Detectamos si estamos en producción (Vercel) o en desarrollo local
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/solve'                     // En Vercel (Ruta relativa)
  : 'http://127.0.0.1:8000/api/solve'; // En Local (Puerto separado)
const COLORES_DISPONIBLES = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export default function MapColoringApp() {
  // --- ESTADOS ---
  const [modo, setModo] = useState('voronoi');
  const [puntos, setPuntos] = useState([]);
  const [enlaces, setEnlaces] = useState([]);
  const [nodoSeleccionado, setNodoSeleccionado] = useState(null);
  
  const [numColores, setNumColores] = useState(3);
  const [historialPasos, setHistorialPasos] = useState([]);
  const [pasoActual, setPasoActual] = useState(0);
  const [coloresRegiones, setColoresRegiones] = useState({});
  
  const [animando, setAnimando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [velocidad, setVelocidad] = useState(200);
  const [mensajeEstado, setMensajeEstado] = useState("Listo para comenzar.");

  // --- LÓGICA DE INTERACCIÓN ---
  const handleCanvasClick = (e) => {
    if (animando) return;
    const svgRect = e.target.closest('svg').getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    if (modo === 'voronoi') {
      setPuntos([...puntos, [x, y]]);
    } else if (e.target.tagName !== 'circle') {
      setPuntos([...puntos, [x, y]]);
      setNodoSeleccionado(null);
    }
  };

  const handleNodeClick = (e, index) => {
    if (modo !== 'grafo' || animando) return;
    e.stopPropagation();
    if (nodoSeleccionado === null) {
      setNodoSeleccionado(index);
    } else if (nodoSeleccionado === index) {
      setNodoSeleccionado(null);
    } else {
      const existe = enlaces.some(l => (l[0]===nodoSeleccionado && l[1]===index) || (l[0]===index && l[1]===nodoSeleccionado));
      if (!existe) setEnlaces([...enlaces, [nodoSeleccionado, index]]);
      setNodoSeleccionado(null);
    }
  };

  // Lógica inteligente para cargar ejemplos según el modo
  const handleCargarEjemplo = () => {
    if (animando) return;
    resetear();

    if (modo === 'voronoi') {
      setPuntos([[100,100],[200,100],[300,100],[150,200],[250,200],[100,300],[200,300],[300,300]]);
      setEnlaces([]);
    } else {
      // Ejemplo de Grafo (Una casita o estrella)
      const ptsGrafo = [[300, 50], [200, 150], [400, 150], [200, 350], [400, 350]];
      const linksGrafo = [[0,1], [0,2], [1,2], [1,3], [2,4], [3,4], [1,4]]; // Conexiones complejas
      setPuntos(ptsGrafo);
      setEnlaces(linksGrafo);
    }
    setMensajeEstado("Ejemplo cargado exitosamente.");
  };

  const handleLimpiar = () => {
    if (animando) return;
    setPuntos([]); setEnlaces([]); setNodoSeleccionado(null);
    resetear();
  };

  const resetear = () => {
    setHistorialPasos([]); setPasoActual(0); setColoresRegiones({});
    setAnimando(false); setPausado(false);
  };

  const handleResolver = async () => {
    resetear();
    setMensajeEstado("Calculando...");
    const adyacencia = construirAdyacencia(puntos, enlaces, modo);
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjacency: adyacencia, colors: COLORES_DISPONIBLES.slice(0, numColores) }),
      });
      const data = await res.json();
      if (data.steps) {
        setHistorialPasos(data.steps);
        setAnimando(true);
        setMensajeEstado("Animando...");
      }
    } catch (e) { console.error(e); setMensajeEstado("Error de red"); }
  };

  // --- MOTOR DE ANIMACIÓN ---
  useEffect(() => {
    let intervalo;
    if (animando && !pausado && pasoActual < historialPasos.length) {
      intervalo = setTimeout(() => {
        const paso = historialPasos[pasoActual];
        if (paso.type === 'assign') setColoresRegiones(p => ({ ...p, [paso.node]: paso.color }));
        if (paso.type === 'backtrack') setColoresRegiones(p => { const c={...p}; delete c[paso.node]; return c; });
        setPasoActual(p => p + 1);
      }, velocidad);
    } else if (pasoActual >= historialPasos.length && historialPasos.length > 0) {
      setAnimando(false); setPausado(false); setMensajeEstado("Finalizado.");
    }
    return () => clearTimeout(intervalo);
  }, [animando, pausado, pasoActual, historialPasos, velocidad]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-blue-400 mt-4">Visualizador de Coloreo de Grafos</h1>
      
      {/* AQUI AUMENTAMOS EL ANCHO MAXIMO A 95vw (Casi toda la pantalla) */}
      <div className="w-full max-w-[95vw] grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUMNA 1: CONTROLES */}
        <div className="lg:col-span-1">
          <ControlPanel 
            modo={modo} setModo={(m) => { setModo(m); handleLimpiar(); }}
            numColores={numColores} setNumColores={setNumColores}
            velocidad={velocidad} setVelocidad={setVelocidad}
            animando={animando} pausado={pausado} setPausado={setPausado}
            onLoadExample={handleCargarEjemplo} onClear={handleLimpiar}
            onSolve={handleResolver} onCancel={() => { setAnimando(false); setPausado(false); }}
            puntosCount={puntos.length}
          />
        </div>

        {/* COLUMNA 2 y 3: MAPA (Lienzo más grande) */}
        <div className="lg:col-span-2">
          <MapCanvas 
            modo={modo} puntos={puntos} enlaces={enlaces}
            coloresRegiones={coloresRegiones}
            historialPasos={historialPasos} pasoActual={pasoActual}
            nodoSeleccionado={nodoSeleccionado}
            onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick}
            animando={animando}
          />
        </div>

        {/* COLUMNA 4: LOG */}
        <div className="lg:col-span-1">
          <LogPanel 
            historialPasos={historialPasos} 
            pasoActual={pasoActual} 
            mensajeEstado={mensajeEstado} 
          />
        </div>
      </div>
    </div>
  );
}