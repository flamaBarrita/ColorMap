// utils/mapHelpers.js
import { Delaunay } from 'd3-delaunay';

export const generarPoligonosVoronoi = (puntos, width = 600, height = 400) => {
  if (puntos.length < 1) return [];
  const delaunay = Delaunay.from(puntos);
  const voronoi = delaunay.voronoi([0, 0, width, height]);
  return puntos.map((_, i) => ({
    id: i,
    path: voronoi.renderCell(i),
    cx: puntos[i][0],
    cy: puntos[i][1]
  }));
};

export const construirAdyacencia = (puntos, enlaces, modo) => {
  const adyacencia = {};
  
  // Inicializar nodos
  for (let i = 0; i < puntos.length; i++) {
    adyacencia[i] = [];
  }

  if (modo === 'voronoi') {
    if (puntos.length < 1) return {};
    const delaunay = Delaunay.from(puntos);
    for (let i = 0; i < puntos.length; i++) {
      const neighbors = delaunay.neighbors(i);
      for (const n of neighbors) {
        adyacencia[i].push(n.toString());
      }
    }
  } else {
    // Modo Grafo Manual
    enlaces.forEach(([a, b]) => {
      if (!adyacencia[a].includes(b.toString())) adyacencia[a].push(b.toString());
      if (!adyacencia[b].includes(a.toString())) adyacencia[b].push(a.toString());
    });
  }
  return adyacencia;
};