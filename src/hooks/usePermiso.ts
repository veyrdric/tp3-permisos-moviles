import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import type * as Notifications from 'expo-notifications';
import { getPermissionsAsync } from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';

import {
  estadoDesdeRespuesta,
  RECURSOS,
  type EstadoPermiso,
  type FichaRecurso,
  type Recurso,
} from '@/lib/permisos';
import { esProvisional, pedirPermisoNotificaciones, puedeAvisar } from '@/lib/notificaciones';
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
  /** Muestra el diálogo del sistema. Sólo se llama desde la pantalla previa. */
  pedir: () => Promise<EstadoPermiso>;
  /** Vuelve a leer el estado sin mostrar ningún diálogo. */
  consultar: () => Promise<void>;
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
  const [notificaciones, setNotificaciones] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);

  const consultar = useCallback(async () => {
    if (recurso === 'camara') {
      await consultarCamara();
      return;
    }
    if (recurso === 'ubicacion') {
      await consultarUbicacion();
      return;
    }
    setNotificaciones(await getPermissionsAsync());
  }, [recurso, consultarCamara, consultarUbicacion]);

  const pedir = useCallback(async (): Promise<EstadoPermiso> => {
    if (recurso === 'camara') return estadoDesdeRespuesta(await pedirCamara());
    if (recurso === 'ubicacion') return estadoDesdeRespuesta(await pedirUbicacion());

    const respuesta = await pedirPermisoNotificaciones();
    setNotificaciones(respuesta);
    return estadoNotificaciones(respuesta);
  }, [recurso, pedirCamara, pedirUbicacion]);

  // Notificaciones no tiene hook propio: la primera lectura va a mano.
  useEffect(() => {
    if (recurso === 'notificaciones') void consultar();
  }, [recurso, consultar]);

  // Al volver de la pantalla previa (modal) o de otra pantalla.
  useFocusEffect(
    useCallback(() => {
      void consultar();
    }, [consultar])
  );

  // Al volver de Ajustes.
  useRevisarAlVolver(consultar);

  const respuesta: RespuestaPermiso =
    recurso === 'camara' ? camara : recurso === 'ubicacion' ? ubicacion : notificaciones;

  const estado: EstadoPermiso =
    recurso === 'notificaciones'
      ? estadoNotificaciones(notificaciones)
      : estadoDesdeRespuesta(respuesta);

  return {
    recurso,
    ficha: RECURSOS[recurso],
    estado,
    respuesta,
    parcial: matizDe(recurso, estado, ubicacion, notificaciones),
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
  ubicacion: Location.LocationPermissionResponse | null,
  notificaciones: Notifications.NotificationPermissionsStatus | null
): string | null {
  if (estado !== 'concedido') return null;
  if (recurso === 'ubicacion' && esAproximada(ubicacion)) return 'Ubicación aproximada';
  if (recurso === 'notificaciones' && esProvisional(notificaciones)) {
    return 'Avisos provisionales (sin diálogo)';
  }
  return null;
}
