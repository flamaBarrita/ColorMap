// Archivo: pages/api/solve.js

export default function handler(req, res) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const { adjacency, colors } = req.body;
  
  // --- Lógica del Motor de Backtracking (Pura Lógica JS/Node) ---
  
  let stepsLog = []; 

  // Valida si es seguro poner el color en el nodo
  const isSafe = (node, color, assignment, adjacencyGraph) => {
    const neighbors = adjacencyGraph[node] || [];
    for (let neighbor of neighbors) {
      if (assignment[neighbor] === color) {
        return false;
      }
    }
    return true;
  };

  const solveBacktracking = (nodes, colorList, assignment, adjacencyGraph) => {
    if (nodes.length === 0) return true;

    const currentNode = nodes[0];

    for (let color of colorList) {
      // 1. Registrar intento
      stepsLog.push({
        type: 'try',
        node: currentNode,
        color: color,
        current_state: { ...assignment }
      });

      if (isSafe(currentNode, color, assignment, adjacencyGraph)) {
        assignment[currentNode] = color;

        // 2. Registrar asignación
        stepsLog.push({
          type: 'assign',
          node: currentNode,
          color: color,
          current_state: { ...assignment }
        });

        // Recursión
        if (solveBacktracking(nodes.slice(1), colorList, assignment, adjacencyGraph)) {
          return true;
        }

        // Backtrack
        delete assignment[currentNode];
        
        // 3. Registrar retroceso
        stepsLog.push({
          type: 'backtrack',
          node: currentNode,
          color: null,
          current_state: { ...assignment }
        });
      }
    }
    return false;
  };

  // --- Ejecución ---

  const assignment = {};
  const nodes = Object.keys(adjacency);
  
  // Ejecutamos el algoritmo
  const success = solveBacktracking(nodes, colors, assignment, adjacency);

  // Devolvemos la respuesta JSON al frontend
  res.status(200).json({
    status: success ? 'solved' : 'impossible',
    solution: success ? assignment : null,
    steps: stepsLog 
  });
}