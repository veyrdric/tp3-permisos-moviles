import type { PermissionResponse } from 'expo-modules-core';

/** Los tres permisos que la app llega a pedir. */
export type Recurso = 'camara' | 'ubicacion' | 'notificaciones';

/**
 * Los cuatro estados con los que trabaja la interfaz. Se derivan de dos campos
 * de la respuesta de Expo: `granted` ("¿puedo usarlo ahora?") y `canAskAgain`
 * ("¿puedo volver a mostrar el diálogo del sistema?").
 */
export type EstadoPermiso = 'cargando' | 'concedido' | 'preguntable' | 'bloqueado';

export type FichaRecurso = {
  titulo: string;
  /** Una frase con el molde "Usamos tu [dato] para [beneficio concreto]". */
  beneficio: string;
  /** Qué sigue funcionando si la persona dice que no. */
  alternativa: string;
  /** Camino exacto en Ajustes cuando el permiso quedó bloqueado. */
  comoActivar: { android: string; ios: string };
};

export const RECURSOS: Record<Recurso, FichaRecurso> = {
  camara: {
    titulo: 'Cámara',
    beneficio:
      'Usamos la cámara para leer el QR pegado en la puerta del aula y para sacar la foto del desperfecto.',
    alternativa: 'Podés escribir el código del aula a mano y adjuntar una foto desde la galería.',
    comoActivar: {
      android: 'Ajustes › Aplicaciones › Mantenimiento IPF › Permisos › Cámara › Permitir',
      ios: 'Ajustes › Mantenimiento IPF › Cámara › activar',
    },
  },
  ubicacion: {
    titulo: 'Ubicación',
    beneficio:
      'Usamos tu ubicación para marcar en qué sector del Instituto está el desperfecto que reportás.',
    alternativa: 'Podés elegir el sector a mano (patio, estacionamiento, pasillo…).',
    comoActivar: {
      android:
        'Ajustes › Aplicaciones › Mantenimiento IPF › Permisos › Ubicación › Permitir mientras se usa la app',
      ios: 'Ajustes › Mantenimiento IPF › Ubicación › Al usar la app',
    },
  },
  notificaciones: {
    titulo: 'Notificaciones',
    beneficio:
      'Usamos las notificaciones para avisarte en el momento en que tu reporte queda resuelto.',
    alternativa: 'Los mismos avisos quedan guardados en la bandeja “Avisos” dentro de la app.',
    comoActivar: {
      android:
        'Ajustes › Aplicaciones › Mantenimiento IPF › Notificaciones › activar el canal “Reportes”',
      ios: 'Ajustes › Mantenimiento IPF › Notificaciones › Permitir notificaciones',
    },
  },
};

export function esRecurso(valor: unknown): valor is Recurso {
  return typeof valor === 'string' && valor in RECURSOS;
}

/**
 * Traduce la respuesta de Expo a uno de los cuatro estados.
 * `null` es el primer render del hook: todavía no sabemos nada.
 */
export function estadoDesdeRespuesta(respuesta: PermissionResponse | null): EstadoPermiso {
  if (!respuesta) return 'cargando';
  if (respuesta.granted) return 'concedido';
  return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
}

export const ETIQUETA_ESTADO: Record<EstadoPermiso, string> = {
  cargando: 'Consultando…',
  concedido: 'Concedido',
  preguntable: 'Se puede preguntar',
  bloqueado: 'Bloqueado',
};
