import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Canal de Android. Tiene que existir ANTES de pedir el permiso. */
export const CANAL_REPORTES = 'reportes';

/**
 * En Android las notificaciones se muestran dentro de un canal. Si pedís
 * POST_NOTIFICATIONS sin haber creado ninguno, el sistema no tiene dónde
 * ubicar los avisos y el diálogo puede no aparecer.
 */
export async function prepararCanalAndroid(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_REPORTES, {
    name: 'Reportes',
    description: 'Avisos sobre el estado de los desperfectos que reportaste.',
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

/** Que el aviso también se vea con la app abierta. */
export function configurarPresentacion(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Pide el permiso de notificaciones. En Android crea el canal primero.
 * `provisional` (sólo iOS) pide avisos silenciosos, que llegan al centro de
 * notificaciones sin mostrar ningún diálogo.
 */
export async function pedirPermisoNotificaciones(
  { provisional = false }: { provisional?: boolean } = {}
): Promise<Notifications.NotificationPermissionsStatus> {
  await prepararCanalAndroid();
  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowProvisional: provisional,
    },
  });
}

/** iOS puede devolver 'granted' con autorización provisional (avisos silenciosos). */
export function esProvisional(
  respuesta: Notifications.NotificationPermissionsStatus | null
): boolean {
  return respuesta?.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/**
 * En iOS, provisional llega como `granted: false` con `ios.status = PROVISIONAL`.
 * Para la app eso es "puede avisar", así que lo tratamos como concedido.
 */
export function puedeAvisar(
  respuesta: Notifications.NotificationPermissionsStatus | null
): boolean {
  if (!respuesta) return false;
  return respuesta.granted || esProvisional(respuesta);
}

/** Aviso local a los 10 segundos, para probar el circuito completo. */
export async function programarAvisoResolucion(
  titulo: string,
  cuerpo: string,
  segundos = 10
): Promise<string | null> {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo, data: { canal: CANAL_REPORTES } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: segundos,
        channelId: CANAL_REPORTES,
      },
    });
  } catch {
    // Expo Go no soporta todo el módulo: el aviso igual queda en /avisos.
    return null;
  }
}
