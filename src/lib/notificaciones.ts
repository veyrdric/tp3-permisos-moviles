import { PermissionStatus } from 'expo-modules-core';
import type { NotificationPermissionsStatus } from 'expo-notifications';
import { Platform } from 'react-native';

/** Canal de Android. Tiene que existir ANTES de pedir el permiso. */
export const CANAL_REPORTES = 'reportes';

type Modulo = typeof import('expo-notifications');

let modulo: Modulo | null | undefined;

/**
 * expo-notifications se carga a mano y dentro de un try/catch.
 *
 * En Android el módulo pide `ExpoTopicSubscriptionModule` apenas se importa,
 * y ese módulo nativo no está en Expo Go: desde SDK 53 Expo Go dejó de
 * incluir el push de Android. Con un `import` normal arriba del archivo, la
 * app se cae al arrancar antes de dibujar nada. Cargándolo acá el fallo queda
 * acotado: la app sigue funcionando y los avisos se leen en /avisos.
 *
 * En una development build el módulo existe y todo anda normal. Es el mismo
 * punto de la Parte D6: Expo Go no es tu app.
 */
function cargar(): Modulo | null {
  if (modulo !== undefined) return modulo;
  try {
    modulo = require('expo-notifications') as Modulo;
  } catch {
    modulo = null;
  }
  return modulo;
}

/** ¿Este entorno tiene el módulo nativo de notificaciones? */
export function hayNotificaciones(): boolean {
  return cargar() !== null;
}

/**
 * Lo que respondemos cuando el módulo no está: no se puede usar y no hay a
 * quién preguntarle. Es la misma forma que devuelve Expo, así que el resto de
 * la app no necesita saber que pasó algo raro.
 */
export const SIN_MODULO: NotificationPermissionsStatus = {
  status: PermissionStatus.DENIED,
  granted: false,
  canAskAgain: false,
  expires: 'never',
};

/**
 * En Android las notificaciones se muestran dentro de un canal. Si pedís
 * POST_NOTIFICATIONS sin haber creado ninguno, el sistema no tiene dónde
 * ubicar los avisos y el diálogo puede no aparecer.
 */
export async function prepararCanalAndroid(): Promise<void> {
  const Notifications = cargar();
  if (!Notifications || Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CANAL_REPORTES, {
    name: 'Reportes',
    description: 'Avisos sobre el estado de los desperfectos que reportaste.',
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

/** Que el aviso también se vea con la app abierta. */
export function configurarPresentacion(): void {
  const Notifications = cargar();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Lee el estado actual sin mostrar ningún diálogo. */
export async function consultarPermisoNotificaciones(): Promise<NotificationPermissionsStatus> {
  const Notifications = cargar();
  if (!Notifications) return SIN_MODULO;
  return Notifications.getPermissionsAsync();
}

/**
 * Pide el permiso. En Android crea el canal primero.
 * `provisional`, sólo en iOS, pide avisos silenciosos: llegan al centro de
 * notificaciones sin mostrar ningún diálogo.
 */
export async function pedirPermisoNotificaciones(
  { provisional = false }: { provisional?: boolean } = {}
): Promise<NotificationPermissionsStatus> {
  const Notifications = cargar();
  if (!Notifications) return SIN_MODULO;

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

/** iOS puede autorizar de forma provisional: avisos silenciosos, sin diálogo. */
export function esProvisional(respuesta: NotificationPermissionsStatus | null): boolean {
  const Notifications = cargar();
  if (!Notifications || !respuesta) return false;
  return respuesta.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/**
 * Con autorización provisional `granted` puede venir en false, pero la app
 * igual puede avisar. Para nosotros eso ya cuenta como concedido.
 */
export function puedeAvisar(respuesta: NotificationPermissionsStatus | null): boolean {
  if (!respuesta) return false;
  return respuesta.granted || esProvisional(respuesta);
}

/** Aviso local a los 10 segundos, para probar el circuito completo. */
export async function programarAvisoResolucion(
  titulo: string,
  cuerpo: string,
  segundos = 10
): Promise<string | null> {
  const Notifications = cargar();
  if (!Notifications) return null;

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
    // El aviso igual queda en /avisos.
    return null;
  }
}
