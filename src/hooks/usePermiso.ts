import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import type * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { Linking } from 'react-native';

import {
  estadoDesdeRespuesta,
  RECURSOS,
  type EstadoPermiso,
  type FichaRecurso,
  type Recurso,
} from '@/lib/permisos';
import {
  consultarPermisoNotificaciones,
  esProvisional,
  hayNotificaciones,
  pedirPermisoNotificaciones,
  puedeAvisar,
} from '@/lib/notificaciones';
import { guardar, leer, suscribir } from '@/lib/registro-permisos';
import { esAproximada } from '@/lib/ubicacion';
import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';

type RespuestaPermiso =
  | Location.LocationPermissionResponse
  | Notifications.NotificationPermissionsStatus
  | null;

export type UsoPermiso = {
  recurso: Recurso;
  ficha: FichaRecurso;
  estado: EstadoPermiso;
  /** Respuesta cruda, por si la pantalla quiere mirar un campo de plataforma. */
  respuesta: RespuestaPermiso;
  /** Matiz cuando el permiso está concedido "a medias". `null` si no aplica. */
  parcial: string | null;
  /**
   * false cuando el módulo nativo no existe en este entorno, que es el caso de
   * las notificaciones en Expo Go para Android. No es que la persona dijo que
   * no: es que acá no hay permiso que pedir.
   */
  disponible: boolean;
  /** Muestra el diálogo del sistema. Sólo se llama desde la pantalla previa. */
  pedir: () => Promise<EstadoPermiso>;
  /** Vuelve a leer el estado sin mostrar ningún diálogo. */
  consultar: () => Promise<void>;
  /** Cuándo se leyó por última vez, para mostrarlo en el panel. */
  consultadoEn: number | null;
  abrirAjustes: () => Promise<void>;
};

/**
 * Un solo hook para los tres permisos de la app.
 *
 * Por dentro usa los hooks oficiales de cada módulo (`useCameraPermissions`,
 * `useForegroundPermissions`) y, para notificaciones, `getPermissionsAsync`,
 * que no tiene hook propio. Hacia afuera todos hablan el mismo idioma:
 * cuatro estados, un matiz y dos acciones.
 *
 * Se refresca solo en dos momentos: cuando la pantalla vuelve a tener foco
 * (por ejemplo al cerrar la pantalla previa) y cuando la app vuelve del
 * segundo plano (por ejemplo al volver de Ajustes).
 */
export function usePermiso(recurso: Recurso): UsoPermiso {
  // `get` dirigido: cada instancia del hook consulta sólo su recurso.
  const [camara, pedirCamara, consultarCamara] = useCameraPermissions({
    get: recurso === 'camara',
    request: false,
  });
  const [ubicacion, pedirUbicacion, consultarUbicacion] = Location.useForegroundPermissions({
    get: recurso === 'ubicacion',
    request: false,
  });
  // La verdad vive en el registro compartido, no en esta instancia del hook.
  const anotacion = useSyncExternalStore(
    suscribir,
    useCallback(() => leer(recurso), [recurso])
  );

  const consultar = useCallback(async () => {
    if (recurso === 'camara') {
      guardar('camara', await consultarCamara());
      return;
    }
    if (recurso === 'ubicacion') {
      guardar('ubicacion', await consultarUbicacion());
      return;
    }
    guardar('notificaciones', await consultarPermisoNotificaciones());
  }, [recurso, consultarCamara, consultarUbicacion]);

  const pedir = useCallback(async (): Promise<EstadoPermiso> => {
    if (recurso === 'camara') {
      const respuesta = await pedirCamara();
      guardar('camara', respuesta);
      return estadoDesdeRespuesta(respuesta);
    }
    if (recurso === 'ubicacion') {
      const respuesta = await pedirUbicacion();
      guardar('ubicacion', respuesta);
      return estadoDesdeRespuesta(respuesta);
    }

    const respuesta = await pedirPermisoNotificaciones();
    guardar('notificaciones', respuesta);
    return estadoNotificaciones(respuesta);
  }, [recurso, pedirCamara, pedirUbicacion]);

  // La primera lectura, al montar.
  useEffect(() => {
    void consultar();
  }, [consultar]);

  // Los hooks de Expo también consultan solos al montar: lo que lean entra
  // al registro igual, para que nadie se quede con una copia aparte.
  useEffect(() => {
    if (recurso === 'camara' && camara) guardar('camara', camara);
  }, [recurso, camara]);

  useEffect(() => {
    if (recurso === 'ubicacion' && ubicacion) guardar('ubicacion', ubicacion);
  }, [recurso, ubicacion]);

  // Al volver de la pantalla previa (modal) o de otra pantalla.
  useFocusEffect(
    useCallback(() => {
      void consultar();
    }, [consultar])
  );

  // Al volver de Ajustes.
  useRevisarAlVolver(consultar);

  const respuesta = (anotacion?.respuesta ?? null) as RespuestaPermiso;

  const estado: EstadoPermiso =
    recurso === 'notificaciones'
      ? estadoNotificaciones(respuesta as Notifications.NotificationPermissionsStatus | null)
      : estadoDesdeRespuesta(respuesta);

  return {
    recurso,
    ficha: RECURSOS[recurso],
    estado,
    disponible: recurso === 'notificaciones' ? hayNotificaciones() : true,
    respuesta,
    consultadoEn: anotacion?.consultadoEn ?? null,
    parcial: matizDe(recurso, estado, respuesta),
    pedir,
    consultar,
    abrirAjustes: async () => {
      await Linking.openSettings();
    },
  };
}

/**
 * iOS puede autorizar de forma provisional: llegan avisos silenciosos aunque
 * `granted` sea false. Para la app eso ya es "puede avisar".
 */
function estadoNotificaciones(
  respuesta: Notifications.NotificationPermissionsStatus | null
): EstadoPermiso {
  if (!respuesta) return 'cargando';
  if (puedeAvisar(respuesta)) return 'concedido';
  return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
}

function matizDe(
  recurso: Recurso,
  estado: EstadoPermiso,
  respuesta: RespuestaPermiso
): string | null {
  if (estado !== 'concedido' || !respuesta) return null;

  if (recurso === 'ubicacion') {
    const ubicacion = respuesta as Location.LocationPermissionResponse;
    return esAproximada(ubicacion) ? 'Ubicación aproximada' : null;
  }
  if (recurso === 'notificaciones') {
    const avisos = respuesta as Notifications.NotificationPermissionsStatus;
    return esProvisional(avisos) ? 'Avisos provisionales (sin diálogo)' : null;
  }
  return null;
}
