from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any

app = FastAPI()

# --- CONFIGURACIÓN DE CORS ---
# Esto es vital para que tu Frontend (Puerto 3000) pueda hablar con Python (Puerto 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, cambia "*" por la URL de tu Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS DE DATOS (Esquema de entrada) ---
# Definimos qué esperamos recibir del Frontend
class DatosEntrada(BaseModel):
    adjacency: Dict[str, List[str]] # El grafo: { "0": ["1", "2"] }
    colors: List[str]               # Los colores: ["#EF4444", "#3B82F6"]

# --- LÓGICA DE NEGOCIO (ALGORITMO) ---

def es_seguro(nodo: str, color_intento: str, asignaciones: Dict[str, str], mapa_vecinos: Dict[str, List[str]]) -> bool:
    """Verifica si el color choca con algún vecino ya coloreado."""
    vecinos = mapa_vecinos.get(nodo, [])
    for vecino in vecinos:
        if vecino in asignaciones and asignaciones[vecino] == color_intento:
            return False
    return True

def resolver_recursivo(nodos_restantes: List[str], colores_disponibles: List[str], asignaciones: Dict[str, str], mapa_vecinos: Dict[str, List[str]], historial: List[Dict[str, Any]]) -> bool:
    """Función recursiva de Backtracking."""
    
    # Caso Base: No quedan nodos por pintar, ¡éxito!
    if not nodos_restantes:
        return True

    nodo_actual = nodos_restantes[0]

    for color in colores_disponibles:
        # 1. REGISTRO (TRY): Intento
        historial.append({
            "type": "try",
            "node": nodo_actual,
            "color": color
        })

        if es_seguro(nodo_actual, color, asignaciones, mapa_vecinos):
            # Asignar temporalmente
            asignaciones[nodo_actual] = color

            # 2. REGISTRO (ASSIGN): Asignación temporal exitosa
            historial.append({
                "type": "assign",
                "node": nodo_actual,
                "color": color
            })

            # Recursión: Intentar con el siguiente nodo
            if resolver_recursivo(nodos_restantes[1:], colores_disponibles, asignaciones, mapa_vecinos, historial):
                return True

            # BACKTRACKING: Si el camino falló, borramos el color
            del asignaciones[nodo_actual]
            
            # 3. REGISTRO (BACKTRACK): Retroceso
            historial.append({
                "type": "backtrack",
                "node": nodo_actual,
                "color": None
            })

    return False

# --- ENDPOINT (API) ---

@app.post("api/solve")
def resolver_mapa(datos: DatosEntrada):
    # Variables para la ejecución
    historial_pasos = []
    asignaciones_finales = {}
    
    # Convertimos las claves del diccionario a una lista de nodos
    lista_nodos = list(datos.adjacency.keys())

    # Ejecutamos el algoritmo
    exito = resolver_recursivo(
        lista_nodos, 
        datos.colors, 
        asignaciones_finales, 
        datos.adjacency, 
        historial_pasos
    )

    # Retornamos la respuesta JSON idéntica a la que enviaba Node.js
    return {
        "status": "solved" if exito else "impossible",
        "solution": asignaciones_finales if exito else None,
        "steps": historial_pasos
    }

# Para correrlo: uvicorn main:app --reload --port 8000