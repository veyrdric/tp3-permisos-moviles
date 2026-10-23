import * as Location from 'expo-location';

export type Ubicacion = {
  latitud: number;
  longitud: number;
  /** true cuando el sistema sólo entregó ubicación aproximada (coarse / reduced). */
  aproximada: boolean;
};

/**
 * ¿El permiso concedido es de precisión reducida?
 * Android lo informa en `android.accuracy` ('fine' | 'coarse') y
 * iOS en `ios.accuracy` ('full' | 'reduced').
 */
export function esAproximada(respuesta: Location.LocationPermissionResponse | null): boolean {
  if (!respuesta?.granted) return false;
  if (respuesta.android) return respuesta.android.accuracy === 'coarse';
  if (respuesta.ios) return respuesta.ios.accuracy === 'reduced';
  return false;
}

/**
 * Devuelve las coordenadas actuales, o `null` si el permiso no está concedido
 * o el sistema no pudo resolver la posición. Nunca lanza: la pantalla que la
 * llama siempre tiene que poder seguir con el sector elegido a mano.
 *
 * Sólo consulta el permiso (get…), no lo pide: pedirlo es decisión de la
 * pantalla previa, no de esta función.
 */
export async function obtenerUbicacion(): Promise<Ubicacion | null> {
  try {
    const permiso = await Location.getForegroundPermissionsAsync();
    if (!permiso.granted) return null;

    const aproximada = esAproximada(permiso);
    const posicion = await Location.getCurrentPositionAsync({
      accuracy: aproximada ? Location.Accuracy.Low : Location.Accuracy.Balanced,
    });

    return {
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
      aproximada,
    };
  } catch {
    return null;
  }
}

/** Texto que ve la persona: con precisión reducida no mostramos coordenadas. */
export function describirUbicacion(ubicacion: Ubicacion): string {
  if (ubicacion.aproximada) return 'Ubicación aproximada';
  return `${ubicacion.latitud.toFixed(5)}, ${ubicacion.longitud.toFixed(5)}`;
}
