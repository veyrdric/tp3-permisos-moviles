import type { PermissionResponse } from 'expo-modules-core';

import type { Recurso } from '@/lib/permisos';

/**
 * Una sola copia del estado de cada permiso, compartida por toda la app.
 *
 * Sin esto, cada pantalla que llama a usePermiso se queda con su propia
 * respuesta, porque los hooks de Expo guardan lo que leyeron en un useState
 * interno, uno por componente. Entonces concedés desde el modal, el modal se
 * actualiza, y la pantalla de atrás sigue diciendo "bloqueado" hasta que
 * alguien la vuelva a consultar.
 *
 * El permiso es un dato del sistema, no de cada pantalla. Acá hay un único
 * lugar donde vive, y cuando cambia se enteran todos a la vez.
 */
export type Anotacion = {
  respuesta: PermissionResponse;
  /** Cuándo se leyó por última vez. Sirve para ver que la consulta pasó. */
  consultadoEn: number;
};

type Escucha = () => void;

const registro = new Map<Recurso, Anotacion>();
const escuchas = new Set<Escucha>();

export function leer(recurso: Recurso): Anotacion | null {
  return registro.get(recurso) ?? null;
}

export function guardar(recurso: Recurso, respuesta: PermissionResponse): void {
  const previo = registro.get(recurso);

  // Si no cambió nada, sólo movemos la hora: así la referencia del objeto
  // `respuesta` se mantiene y no forzamos renders al pedo.
  const igual =
    previo &&
    previo.respuesta.status === respuesta.status &&
    previo.respuesta.granted === respuesta.granted &&
    previo.respuesta.canAskAgain === respuesta.canAskAgain;

  registro.set(recurso, {
    respuesta: igual ? previo.respuesta : respuesta,
    consultadoEn: Date.now(),
  });

  for (const escucha of escuchas) escucha();
}

export function suscribir(escucha: Escucha): () => void {
  escuchas.add(escucha);
  return () => {
    escuchas.delete(escucha);
  };
}
