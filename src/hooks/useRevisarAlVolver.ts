import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Llama a `revisar()` cada vez que la app vuelve al primer plano.
 *
 * Hace falta porque los hooks de Expo guardan la última respuesta que leyeron:
 * si la persona se va a Ajustes y cambia el permiso, nadie les avisa. El único
 * momento en que podemos enterarnos es cuando la app vuelve a estar activa.
 */
export function useRevisarAlVolver(revisar: () => void) {
  const anterior = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nuevo) => {
      const estabaAfuera = anterior.current === 'background' || anterior.current === 'inactive';
      if (estabaAfuera && nuevo === 'active') revisar();
      anterior.current = nuevo;
    });
    return () => sub.remove();
  }, [revisar]);
}
