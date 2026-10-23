# Trabajo Práctico N° 3 — Permisos móviles: Android, iOS y Expo

**Taller Complementario – React Native II · Instituto Politécnico Formosa**

Respuestas de las Partes A a F. La Parte G (el sistema “Mantenimiento IPF”) está en este
mismo repositorio; el recorrido del código se explica en [README.md](./README.md).

---

## Parte A · ¿Qué es un permiso y por qué existe?

### A1. Conceptos

**a) ¿Qué es un permiso?**

Un permiso es la autorización que el sistema operativo exige antes de dejar que una app toque
un recurso sensible: la cámara, el micrófono, la ubicación, los contactos, la capacidad de
mostrar notificaciones. No es una función del lenguaje ni una librería: es una regla del
sistema, y se cumple aunque el código haga lo contrario.

Los tres papeles:

- **La app** *declara* qué va a necesitar y *solicita* el permiso en tiempo de ejecución. Nunca
  se lo concede a sí misma.
- **El sistema operativo** es el único que puede conceder o negar. Dibuja el diálogo, guarda la
  respuesta y, a partir de ahí, deja pasar o bloquea cada llamada a la API protegida.
- **La persona usuaria** decide. Su respuesta vale más que el código: puede decir que no, puede
  cambiar de opinión más tarde desde Ajustes y puede revocar lo que ya concedió.

**b) La caja de arena (sandbox)**

Cada app corre dentro de su propia caja: su propio proceso, su propio usuario de Linux (en
Android), su propio directorio de archivos. Desde adentro no ve la memoria de otras apps ni sus
archivos ni el hardware sensible. Los permisos son las puertas de esa caja: cada permiso
concedido abre una puerta concreta y nada más que ésa.

Sin ningún permiso una app todavía puede hacer bastante: dibujar su interfaz, leer y escribir
en su propio directorio privado, usar el almacenamiento clave-valor propio, hacer cálculos,
leer los sensores no sensibles (acelerómetro, giróscopo), abrir otras apps por intent o deep
link, usar el selector de archivos o de fotos del sistema (porque el selector corre **fuera**
de la caja y devuelve sólo lo elegido) y sacar una foto delegando en la app de cámara del
sistema. En Android, además, `INTERNET` se concede solo al instalar.

**c) Las cuatro razones por las que existen**

| Razón | Ejemplo concreto |
| --- | --- |
| **Privacidad** — hay datos que son de la persona, no de la app | Una app de linterna no tiene por qué leer la agenda de contactos. |
| **Seguridad** — evitar que una app haga daño o espíe | Sin permiso de micrófono, una app no puede grabar una reunión de fondo. |
| **Transparencia** — que la persona se entere de lo que pasa | El punto verde de iOS/Android avisa que la cámara está activa, aunque el permiso ya esté concedido. |
| **Control** — poder cambiar de opinión cuando sea | Concedo la ubicación para pedir un delivery y la revoco esa misma noche desde Ajustes. |

**d) La analogía del portero**

- La **visita** es la app, que quiere entrar a un departamento que no es suyo.
- El **portero** es el sistema operativo: nadie entra sin pasar por él, y es él quien toca el
  timbre, no la visita.
- El **dueño del departamento** es la persona usuaria: es la única que puede decir que sí.

Que “el portero se acuerda de la respuesta” significa que la decisión queda **persistida**: el
sistema guarda el sí o el no asociado a esa app, y en las siguientes visitas ya no vuelve a
tocar el timbre. Si fue que sí, deja pasar directo; si fue que no (y en Android fue dos veces),
rebota a la visita sin molestar al dueño. Por eso una app no puede “volver a intentar” hasta
que la persona cambie la decisión desde Ajustes, y por eso el estado sobrevive a cerrar la app
y a reiniciar el teléfono.

### A2. Declarar y solicitar

| | **Declarar (al compilar)** | **Solicitar (al ejecutar)** |
| --- | --- | --- |
| **¿Qué se hace?** | Dejar escrito en el paquete qué recursos la app podría llegar a usar y, en iOS, con qué propósito. Es una promesa estática que viaja dentro del binario. | Mostrar el diálogo del sistema en el momento en que la función hace falta y leer la respuesta de la persona. Es dinámico, ocurre con la app corriendo. |
| **¿Dónde / cómo en Android?** | `<uses-permission android:name="android.permission.CAMERA" />` en `AndroidManifest.xml`. | `ActivityCompat.requestPermissions(...)` en Android nativo; desde Expo, `requestCameraPermissionsAsync()` / `useCameraPermissions()`. |
| **¿Dónde / cómo en iOS?** | Una clave de propósito en `Info.plist`: `NSCameraUsageDescription` con un texto en el idioma de la persona. No existe una lista de permisos aparte. | La primera llamada a la API protegida dispara el diálogo; con Expo, `requestCameraPermissionsAsync()`. |
| **¿Dónde / cómo en Expo?** | En `app.json` / `app.config.ts`: los *config plugins* (`expo-camera`, `expo-location`, …) con sus textos de propósito, más `android.permissions` y `android.blockedPermissions`. `npx expo prebuild` traduce eso a manifiesto e `Info.plist`. | Las funciones y hooks de cada módulo: `useCameraPermissions()`, `Location.requestForegroundPermissionsAsync()`, `Notifications.requestPermissionsAsync()`. |
| **¿Qué pasa si se omite?** | **Android:** el diálogo nunca aparece; la solicitud devuelve denegado al instante. **iOS:** la app **crashea** al tocar la API protegida, y App Store Connect rechaza la build al subirla. | El permiso queda “sin decidir” para siempre: la app nunca accede al recurso, aunque esté declarado. En iOS, declarar no concede nada. |

### A3. Verdadero o falso

**a) El diálogo de permiso lo dibuja tu app con componentes de React Native. — FALSO.**
Lo dibuja el sistema operativo, fuera del proceso de la app. La app no puede cambiarle el
texto, el estilo ni los botones, ni leer qué está tocando la persona. Lo que sí podés dibujar
con React Native es la pantalla *previa*, antes de disparar el diálogo.

**b) En Expo, la fuente de verdad de los permisos es `app.json` (o `app.config.ts`), no el
`AndroidManifest.xml`. — VERDADERO.**
En el flujo gestionado, `npx expo prebuild` **regenera** las carpetas `android/` e `ios/` desde
la configuración. Todo lo que edites a mano en el manifiesto se pierde en la siguiente
regeneración.

**c) Agregar un permiso nuevo en el `Info.plist` se puede publicar con una actualización OTA. —
FALSO.**
Una actualización OTA (EAS Update) reemplaza el *bundle* de JavaScript y los assets, no el
binario nativo. El `Info.plist`, el `AndroidManifest.xml` y los módulos nativos viajan dentro
del binario: cambiarlos exige compilar y publicar una build nueva en la tienda.

**d) Si tu código pide un permiso que no está en el manifiesto, Android igual muestra el
diálogo. — FALSO.**
Android consulta primero el manifiesto. Si el permiso no está declarado, no muestra nada y
devuelve denegado inmediatamente, con `canAskAgain: false`. Es el error que produce el clásico
“llamo a `request…()` y no pasa nada”.

**e) El paquete `expo-permissions` es la forma recomendada en SDK 57. — FALSO.**
`expo-permissions` está **deprecado y eliminado** desde SDK 42-43. Hoy cada módulo trae sus
propios métodos y hooks (`expo-camera`, `expo-location`, `expo-notifications`…). Ver un
`import * as Permissions from 'expo-permissions'` es la señal más rápida de que un tutorial
quedó viejo.

**f) En iOS, las notificaciones no llevan texto de propósito en el `Info.plist`. — VERDADERO.**
Las notificaciones no tienen clave `NS…UsageDescription`. El diálogo lo arma iOS entero
(“«App» quiere enviarte notificaciones”) y el permiso se pide con
`UNUserNotificationCenter` / `Notifications.requestPermissionsAsync()`.

**g) Con acceso limitado a fotos, `status` vale `'granted'` y el matiz está en
`accessPrivileges`. — VERDADERO.**
Para la app el permiso está concedido: puede leer fotos. `accessPrivileges` distingue `'all'`
de `'limited'` (la persona eligió un subconjunto). Hay que leerlo, porque con `'limited'` la
galería que ve la app es sólo esa selección.

**h) Desinstalar y reinstalar es la forma confiable de volver a “sin decidir” en las dos
plataformas. — FALSO.**
En iOS sí suele funcionar, pero no siempre de inmediato: el sistema recuerda decisiones
recientes por un tiempo y reinstalar rápido puede mantener el estado. En Android, además, la
restauración automática de copias de seguridad puede devolver permisos concedidos. Lo
confiable es resetear a propósito: `adb shell pm reset-permissions` en Android y
`xcrun simctl privacy booted reset all <bundleId>` en el simulador de iOS.

### A4. Los estados de un permiso

**a) Diagrama de estados**

```
ANDROID                                   iOS
                                        
  ┌───────────────┐                       ┌───────────────┐
  │  sin decidir  │                       │  sin decidir  │
  └───────┬───────┘                       └───────┬───────┘
          │ request() → diálogo                   │ request() → diálogo (UNA sola vez)
   ┌──────┴───────┐                        ┌──────┴───────┐
   ▼              ▼                        ▼              ▼
┌─────────┐  ┌──────────┐              ┌─────────┐  ┌──────────┐
│concedido│  │ denegado │              │concedido│  │ denegado │
└────┬────┘  └────┬─────┘              └────┬────┘  └────┬─────┘
     │            │ request() otra vez      │            │ (el diálogo ya no vuelve)
     │            ▼                         │            │
     │      ┌──────────┐                    │            │
     │      │bloqueado │                    │            │
     │      │(2 “No”)  │                    │            │
     │      └────┬─────┘                    │            │
     └───────────┴──── Ajustes ─────────────┴────────────┘
          (la persona cambia la decisión en cualquier momento)
```

**La diferencia central:** Android da **dos oportunidades** de mostrar el diálogo (desde Android
11, dos “No permitir” equivalen a “no volver a preguntar” y el permiso queda bloqueado); iOS da
**una sola**. En iOS, el primer “No permitir” es definitivo desde el punto de vista de la app:
a partir de ahí el único camino es Ajustes.

Dicho de otro modo: en Android el estado “denegado pero se puede volver a pedir” existe de
verdad y hay que programarlo; en iOS ese estado prácticamente no existe, porque un rechazo pasa
directo a “bloqueado”.

**b) Qué devuelve Expo en cada estado**

| Estado | `status` | `canAskAgain` | ¿Puede aparecer el diálogo? |
| --- | --- | --- | --- |
| **Sin decidir** | `'undetermined'` | `true` | Sí. Es el único caso en que el diálogo aparece seguro. |
| **Concedido** | `'granted'` (`granted: true`) | `true` | No hace falta: `request…()` resuelve sin mostrar nada. |
| **Denegado (se puede volver a pedir)** | `'denied'` | `true` | Sí (Android, primer rechazo). |
| **Bloqueado** | `'denied'` | `false` | No. `request…()` resuelve igual, con el mismo `denied`, sin mostrar nada. Sólo Ajustes lo cambia. |

---

## Parte B · Android: tipos de permisos y manifiesto

### B1. Clasificá los permisos

| Permiso | Tipo | ¿Cómo se obtiene? |
| --- | --- | --- |
| `INTERNET` | De instalación (*normal*) | Se concede solo al instalar, con declararlo en el manifiesto. No hay diálogo. |
| `CAMERA` | De tiempo de ejecución (*dangerous*) | Declarar + `requestCameraPermissionsAsync()`; el sistema muestra el diálogo. |
| `VIBRATE` | De instalación (*normal*) | Se concede solo al instalar. |
| `SYSTEM_ALERT_WINDOW` | **Especial** | Declarar + mandar a la persona a una pantalla de Ajustes (“Mostrar sobre otras apps”) con `Settings.ACTION_MANAGE_OVERLAY_PERMISSION`. No hay diálogo. |
| `POST_NOTIFICATIONS` | De tiempo de ejecución (desde Android 13) | Declarar + `Notifications.requestPermissionsAsync()`. En Android 12 o anterior se concede solo. |
| `ACCESS_NETWORK_STATE` | De instalación (*normal*) | Se concede solo al instalar. |
| `READ_CONTACTS` | De tiempo de ejecución | Declarar + pedirlo con diálogo. Desde el 27/01/2027 Google Play además exige declaración si se apunta a API 37+. |
| `SCHEDULE_EXACT_ALARM` | **Especial** (desde Android 12) | Declarar + mandar a Ajustes (“Alarmas y recordatorios”) con `ACTION_REQUEST_SCHEDULE_EXACT_ALARM`. Para muchos casos conviene `USE_EXACT_ALARM`, que sí se concede solo pero tiene política de tienda estricta. |
| `RECORD_AUDIO` | De tiempo de ejecución | Declarar + diálogo. |
| `MANAGE_EXTERNAL_STORAGE` | **Especial** | Declarar + Ajustes (“Acceso a todos los archivos”) **y** justificarlo ante Google Play, que lo aprueba caso por caso. |

### B2. Grupos y nombres

**a)** Un **grupo de permisos** es un conjunto de permisos sobre el mismo recurso conceptual
(`LOCATION`, `CAMERA`, `CONTACTS`, `MICROPHONE`…). El diálogo del sistema habla del grupo, no
del permiso individual: si la app pide `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION`
juntos, la persona ve **un solo diálogo** — el de ubicación, con la opción de dar precisa o
aproximada. En Android 12+ ese diálogo trae el selector “Precisa / Aproximada”.

**b)** El prefijo es `android.permission.`. El nombre completo del permiso de cámara es
**`android.permission.CAMERA`**. (Las excepciones son los permisos de otras librerías, que
llevan su propio prefijo: `com.google.android.gms.permission.ACTIVITY_RECOGNITION`.)

**c)** Los **permisos de firma** (`protectionLevel="signature"`) sólo se conceden a una app
firmada con el **mismo certificado** que la app que los define. No hay diálogo ni Ajustes: o la
firma coincide o no se conceden. Se usan entre apps del mismo fabricante o entre una app y su
servicio del sistema; en una app común no sirven, porque no controlás la firma de la otra
parte.

### B3. Leé el manifiesto

**a) Qué se concede solo y qué hay que pedir**

- **Solos al instalar:** `INTERNET` (de instalación, nivel *normal*).
- **Hay que pedirlos en tiempo de ejecución:** `CAMERA`, `ACCESS_COARSE_LOCATION`,
  `ACCESS_FINE_LOCATION` (los dos con un único diálogo) y `POST_NOTIFICATIONS`.
- `READ_EXTERNAL_STORAGE` es de tiempo de ejecución, pero sólo existe hasta Android 12
  (ver abajo): en Android 13+ ni se instala.
- `RECORD_AUDIO` **no está** en el APK final: `tools:node="remove"` lo saca.

**b) `android:maxSdkVersion="32"`**

Significa que el permiso se instala y se pide **sólo hasta API 32** (Android 12L). Desde API 33
Android ya no lo incluye en el paquete. Se usa para los permisos que una versión nueva
reemplazó, y evita pedir en Android 13+ un permiso que ahí no existe.

Desde Android 13, `READ_EXTERNAL_STORAGE` quedó partido por tipo de medio:
`READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` y `READ_MEDIA_AUDIO`. Y desde Android 14 se suma
`READ_MEDIA_VISUAL_USER_SELECTED`, el acceso parcial (“Seleccionar fotos”).

**c) `tools:node="remove"`**

Es una instrucción para el *manifest merger* de Gradle: “cuando fusiones los manifiestos, borrá
esta entrada”. Sirve para sacar un permiso que **una librería** declara por su cuenta y que tu
app no usa. Sin esto, la librería lo mete igual y la ficha de Play lo muestra.

En Expo no se escribe a mano, se genera con `blockedPermissions`:

```json
{
  "expo": {
    "android": {
      "blockedPermissions": ["android.permission.RECORD_AUDIO"]
    }
  }
}
```

**d) Agregar `SCHEDULE_EXACT_ALARM`**

Va en **`expo.android.permissions`**, que es la lista de permisos extra que ninguna librería
declara:

```json
{
  "expo": {
    "android": {
      "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"]
    }
  }
}
```

(Ojo: declararlo no alcanza, porque es un permiso **especial**: hay que llevar a la persona a
la pantalla de Ajustes correspondiente.)

**e) Por qué no conviene editarlo a mano**

Porque `android/` es una carpeta **generada**. `npx expo prebuild` la vuelve a crear desde
`app.json`, y cualquier edición manual desaparece. Además `android/` suele estar en
`.gitignore`, así que el cambio tampoco viaja al repositorio ni a EAS Build.

**¿Funciona `blockedPermissions` en Expo Go?** **No.** Expo Go es una app ya compilada, con su
propio manifiesto y su propio `Info.plist`, que declara todos los permisos que puedan necesitar
los módulos que trae. Tu `app.json` no lo modifica. `blockedPermissions` (como los textos de
propósito) recién tiene efecto en una *development build* o en una build de producción.

### B4. Así pregunta Android

**a)** No: el texto del diálogo de Android lo arma el sistema a partir del grupo de permisos, y
la app **no puede** agregarle nada. Por eso la explicación va **antes**, en una pantalla propia
(la pantalla previa), o en el contexto de la pantalla desde la que se pide. Es exactamente lo
que hace `/permisos/[recurso]` en la Parte G.

**b)** “**Mientras la app está en uso**” concede el permiso de forma persistente, pero sólo
mientras la app está en primer plano (y un ratito después). “**Solo esta vez**” concede un
permiso temporal que se revoca al salir de la app: la próxima vez vuelve a estar “sin decidir”.
La opción “Solo esta vez” existe desde Android 11 para los permisos más sensibles: **ubicación,
cámara y micrófono**.

**c)** En Android 11+, dos “No permitir” equivalen a “no volver a preguntar”: el permiso queda
**bloqueado**. `canAskAgain` pasa a `false`, `status` queda en `'denied'` y las llamadas
siguientes a `request…()` resuelven sin mostrar nada. El único camino es Ajustes.

**d)** La ubicación aproximada (~3 km²) alcanza para: mostrar el clima de la ciudad, ofrecer el
idioma o la moneda del país, listar “sucursales en tu zona”, elegir el servidor más cercano.
**No** alcanza para: navegación paso a paso, “¿a qué distancia estoy de la puerta?”, geocercas
chicas, registrar el recorrido de una carrera o encontrar el auto en el estacionamiento.

**e)** Android **mata el proceso de la app**. Revocar un permiso desde Ajustes mientras la app
corre fuerza su reinicio para que ningún código siga corriendo con un permiso que ya no tiene.
Para la persona, la app se reabre desde cero. Ése es el motivo por el que, al volver de
Ajustes, conviene volver a consultar el permiso en vez de confiar en lo que la app guardó en
memoria (es lo que hace `useRevisarAlVolver` en la Parte G; en iOS el proceso **no** se mata,
pero el estado igual cambió).

### B5. Android, versión por versión

| Cambio | Versión (API) | Qué implica para el código |
| --- | --- | --- |
| Nacen los permisos en tiempo de ejecución | **Android 6.0 · API 23** | Declarar deja de alcanzar: hay que pedir y **leer la respuesta** en cada uso. Nace el estado “denegado”. |
| La ubicación en segundo plano pasa a ser un permiso aparte | **Android 10 · API 29** | `ACCESS_BACKGROUND_LOCATION` se pide por separado, y sólo tiene sentido si ya tenés el de primer plano. |
| Dos rechazos equivalen a “no volver a preguntar” | **Android 11 · API 30** | Hay que manejar `canAskAgain: false`: el botón deja de ser “Continuar” y pasa a ser “Abrir Ajustes”. Además el permiso de background ya no se puede pedir con diálogo: hay que mandar a Ajustes. |
| Ubicación precisa o aproximada | **Android 12 · API 31** | El diálogo trae el selector. Hay que leer `android.accuracy` (`'fine'` / `'coarse'`) y degradar la función si es aproximada. |
| Las notificaciones pasan a ser un permiso (`POST_NOTIFICATIONS`) | **Android 13 · API 33** | Notificar deja de estar garantizado: hay que declarar, crear el canal y pedir el permiso en contexto. |
| Acceso parcial a fotos y videos (“Seleccionar fotos”) | **Android 14 · API 34** | Aparece `READ_MEDIA_VISUAL_USER_SELECTED`: `granted` puede significar “sólo estas fotos”. Lo más sano es no pedir el permiso y usar el *photo picker*. |
| Permiso de red local (`ACCESS_LOCAL_NETWORK`) | **Android 16 · API 36** (opt-in, con `NEARBY_WIFI_DEVICES`) y **Android 17 · API 37** (obligatorio, ya con nombre propio, dentro del grupo `NEARBY_DEVICES`) | Hablar con un dispositivo de la red local (mDNS, SSDP, sockets crudos) pasa a necesitar permiso en tiempo de ejecución. Apps que apuntan a menos de API 37 reciben una concesión implícita y temporal: la recomendación oficial es **no** pedirlo al runtime hasta apuntar a 37. |

**¿Qué es el `targetSdkVersion`?** Es la versión de Android para la que la app declara estar
preparada. El sistema la usa para decidir qué cambios de comportamiento le aplica: una app con
`targetSdk` 32 sigue sin necesitar `POST_NOTIFICATIONS` aunque corra en Android 14, porque
Android le mantiene el comportamiento viejo por compatibilidad. Subirlo es aceptar las reglas
nuevas.

**Expo SDK 57** apunta a **API 36 (Android 16)**, con `minSdkVersion` 24 y `compileSdk` 36
(verificado en `android/build.gradle` tras `npx expo prebuild`). Y **Google Play exige, desde el
31 de agosto de 2026**, que las apps nuevas y las actualizaciones apunten a **API 36 (Android
16)**; quien necesite más tiempo puede pedir una prórroga hasta el 1/11/2026. Es decir: Expo SDK
57 ya cumple con el requisito sin tocar nada.

---

## Parte C · iOS: textos de propósito y acceso parcial

### C1. Claves del `Info.plist`

| Recurso | Clave en `Info.plist` |
| --- | --- |
| Cámara | `NSCameraUsageDescription` |
| Micrófono | `NSMicrophoneUsageDescription` |
| Ubicación en uso | `NSLocationWhenInUseUsageDescription` |
| Ubicación siempre | `NSLocationAlwaysAndWhenInUseUsageDescription` (más `NSLocationWhenInUseUsageDescription`, que es obligatoria igual; `NSLocationAlwaysUsageDescription` quedó sólo para iOS 10 y anteriores) |
| Fotos (leer) | `NSPhotoLibraryUsageDescription` |
| Fotos (solo guardar) | `NSPhotoLibraryAddUsageDescription` |
| Contactos | `NSContactsUsageDescription` |
| Face ID | `NSFaceIDUsageDescription` |
| Rastreo entre apps (ATT) | `NSUserTrackingUsageDescription` |
| Notificaciones | **No lleva clave.** El texto del diálogo lo arma iOS entero. |

### C2. Sin texto, no hay permiso

**a)** Si falta el texto de propósito y la app toca la cámara, iOS **mata la app en el acto**
(crash por TCC, con el mensaje “This app has crashed because it attempted to access
privacy-sensitive data without a usage description”). No es un error que puedas capturar con
`try/catch`: el sistema termina el proceso.

Al subir la build a App Store Connect, el chequeo automático la **rechaza** antes de llegar a
revisión, con el error **`ITMS-90683: Missing Purpose String in Info.plist`**, nombrando la
clave que falta.

**b)** **Una sola vez.** iOS muestra el diálogo de cada permiso una única vez en la vida de la
instalación. Si la persona dice que no, a la app le queda: (1) seguir funcionando con una
alternativa que no use ese recurso, y (2) ofrecer un camino claro a Ajustes
(`Linking.openSettings()`) explicando qué se gana al activarlo. Lo que **no** le queda es
volver a mostrar el diálogo.

**c)** iOS arma el encabezado y los botones (“«Mantenimiento IPF» quiere acceder a la cámara” /
“No permitir” / “OK”). **Vos escribís** únicamente la frase del medio: el texto de propósito
del `Info.plist`. En Expo ese texto se configura en `app.json`, en las props del config plugin
del módulo:

```json
["expo-camera", {
  "cameraPermission": "Usamos la cámara para leer el QR pegado en la puerta del aula…"
}]
```

(También se puede escribir directo en `expo.ios.infoPlist`, pero el plugin es lo recomendado
porque además agrega el permiso de Android correspondiente.)

**d)** Pasa porque el chequeo de Apple es **estático**: analiza el binario y, si encuentra una
API protegida enlazada —aunque esté en el código de una librería y tu app nunca la llame—,
exige la clave de propósito. El SDK de la librería viaja dentro de tu binario, así que para
Apple es tu app la que la usa.

Se resuelve de alguna de estas tres formas, en orden de preferencia:
1. **Sacar la librería** o reemplazarla por una que no enlace esa API (lo más limpio: si no la
   usás, no la lleves).
2. **Apagar la función** desde el config plugin, cuando la librería lo permite — es lo que hace
   `microphonePermission: false` con `expo-camera`.
3. **Agregar la clave igual**, con un texto honesto que explique en qué caso se usaría. Si no
   se usa nunca, esto es lo peor: le pedís a la persona algo que no necesitás.

Y si la API aparece en la lista de *required reason APIs*, hay que declarar el motivo en el
manifiesto de privacidad (`PrivacyInfo.xcprivacy`).

### C3. Probador de textos de propósito

Pauta **5.1.1** de Apple: hay que explicar *específicamente* cómo se usa el dato y qué gana la
persona. “Lo necesita el sistema” o “mejora tu experiencia” no son razones.

| Texto propuesto | ¿Aprobado? | Versión mejorada |
| --- | --- | --- |
| “Necesitamos tu ubicación.” | **No.** Dice *qué* pide, no *para qué*. No hay beneficio. | “Usamos tu ubicación para mostrarte las farmacias de turno que tenés a menos de diez cuadras.” |
| “Para mejorar tu experiencia.” | **No.** Es el ejemplo de manual de lo genérico: sirve para cualquier permiso de cualquier app, o sea para ninguno. | “Usamos tu ubicación para ordenar las farmacias de turno de la más cercana a la más lejana.” |
| “Usamos tu ubicación para mostrarte las farmacias de turno más cercanas.” | **Sí.** Dice el dato, el uso y el beneficio concreto, en una frase y en el idioma de la persona. | — |
| “La app no funciona sin ubicación.” | **No.** No explica el uso y además suena a amenaza; Apple lo lee como coacción, y en general es mentira (algo se puede hacer igual). | “Usamos tu ubicación para encontrar farmacias cerca tuyo; si preferís, podés buscar por barrio a mano.” |
| “Ubicación requerida por el sistema.” | **No.** Es falso: el sistema no requiere nada, la que pide es la app. Echarle la culpa al sistema es justamente lo que la pauta prohíbe. | “Usamos tu ubicación para mostrarte qué farmacia de turno te queda más cerca ahora.” |

### C4. Acceso parcial y gradual

| Caso | iOS | En Expo |
| --- | --- | --- |
| Fotos limitadas (“Seleccionar fotos”) | **iOS 14** | `expo-media-library`: `accessPrivileges === 'limited'` en la respuesta; se amplía la selección con `MediaLibrary.presentPermissionsPickerAsync()`. |
| Ubicación aproximada (interruptor “Precisa”) | **iOS 14** | `expo-location`: `respuesta.ios.accuracy === 'reduced'` (y `'full'` cuando es precisa). Para pedir precisión temporal existe `Location.enableNetworkProviderAsync()` en Android y, en iOS, el flujo de *temporary full accuracy*. |
| “Permitir una vez” (ubicación) | **iOS 13** | No hay campo propio: llega como `status: 'granted'`. Se detecta porque, al reabrir la app, el permiso volvió a `'undetermined'` → hay que consultarlo en cada arranque y no cachearlo. |
| Ubicación escalonada: de “al usar la app” a “Siempre” | **iOS 13** | Primero `Location.requestForegroundPermissionsAsync()`; sólo después, y cuando la función lo justifique, `Location.requestBackgroundPermissionsAsync()`. El resultado se lee en `ios.scope` (`'whenInUse'` / `'always'`). |
| Notificaciones provisionales | **iOS 12** | `Notifications.requestPermissionsAsync({ ios: { allowProvisional: true } })`; se detecta con `respuesta.ios.status === Notifications.IosAuthorizationStatus.PROVISIONAL`. |
| Rastreo entre apps (ATT) | **iOS 14.5** | `expo-tracking-transparency`: `requestTrackingPermissionsAsync()` / `useTrackingPermissions()`, con `NSUserTrackingUsageDescription` en el `Info.plist`. |

**¿Qué versión mínima de iOS requiere Expo SDK 57?** **iOS 16.4** (es el
`ios.deploymentTarget` por defecto del `Podfile` que genera `npx expo prebuild` en este
proyecto).

**Consecuencia práctica:** **todas** las funciones de la tabla ya existen en el piso soportado.
No hace falta ni un solo `if (Platform.Version >= 14)`: el código puede leer `accessPrivileges`,
`ios.accuracy` o `IosAuthorizationStatus.PROVISIONAL` sabiendo que el campo siempre está. Lo
que hay que programar no son versiones, sino **matices**: que `granted` pueda significar “sólo
estas fotos”, “aproximada” o “sólo esta vez”.

### C5. Android vs iOS, lado a lado

| | **Android** | **iOS** |
| --- | --- | --- |
| **¿Dónde se declara?** | `AndroidManifest.xml`, con `<uses-permission>`. En Expo, vía config plugins + `android.permissions`. | `Info.plist`, con una clave `NS…UsageDescription` **que incluye el texto**. En Expo, vía las props de los config plugins. |
| **Texto en el diálogo** | Lo arma el sistema a partir del grupo. La app **no** puede agregar nada. | Lo escribe la app (el texto de propósito) y el sistema lo enmarca. |
| **Oportunidades para preguntar** | Dos: al segundo “No permitir” queda bloqueado (Android 11+). | Una sola. El “No” es definitivo para la app. |
| **“Solo esta vez” / “Permitir una vez”** | Desde Android 11, para ubicación, cámara y micrófono. | Desde iOS 13, sólo para **ubicación**. |
| **Notificaciones** | Permiso de tiempo de ejecución (`POST_NOTIFICATIONS`) desde Android 13; antes se concedían solas. Requiere **canal** creado antes. | Permiso desde siempre, sin clave en el `Info.plist`. Admite modo **provisional** (sin diálogo). |
| **Ubicación en segundo plano** | Permiso aparte (`ACCESS_BACKGROUND_LOCATION`) desde Android 10; desde Android 11 **no se puede pedir con diálogo**: hay que mandar a Ajustes. Google Play exige justificarlo con un formulario y un video. | Se pide con `requestBackgroundPermissionsAsync()` después del de primer plano; iOS además muestra recordatorios periódicos (“la app usó tu ubicación N veces”). |
| **Si falta la declaración** | No aparece ningún diálogo: la solicitud devuelve denegado al instante, con `canAskAgain: false`. | **La app crashea** al tocar la API, y App Store Connect rechaza la build (`ITMS-90683`). |

---

## Parte D · Expo: una API, dos plataformas

### D1. Módulos y funciones

| Necesidad | Módulo | Hook / función de permiso |
| --- | --- | --- |
| Escanear un QR con la cámara | `expo-camera` | `useCameraPermissions()` (o `Camera.requestCameraPermissionsAsync()`) |
| Grabar video con sonido | `expo-camera` | `useCameraPermissions()` **y** `useMicrophonePermissions()` — son dos permisos distintos |
| Mostrar farmacias cercanas | `expo-location` | `useForegroundPermissions()` / `requestForegroundPermissionsAsync()` |
| Seguir un envío con la app en segundo plano | `expo-location` (+ `expo-task-manager`) | `requestForegroundPermissionsAsync()` **primero** y después `requestBackgroundPermissionsAsync()` |
| Mostrar un recordatorio | `expo-notifications` | `Notifications.requestPermissionsAsync()`, con `setNotificationChannelAsync()` antes en Android |
| Grabar una nota de voz | `expo-audio` | `AudioModule.requestRecordingPermissionsAsync()` (o `useAudioRecorderPermissions()`) |
| Galería propia dentro de la app | `expo-media-library` | `MediaLibrary.usePermissions()` / `requestPermissionsAsync()` — mirando `accessPrivileges` |
| Publicidad personalizada entre apps (iOS) | `expo-tracking-transparency` | `requestTrackingPermissionsAsync()` / `useTrackingPermissions()` |

**Un tutorial usa `import * as Permissions from 'expo-permissions'`.** Me dice que el tutorial
quedó viejo: ese paquete está deprecado desde SDK 41 y **eliminado** desde SDK 43. Si el
tutorial sigue ahí, es de 2020-2021 y probablemente todo lo demás también esté desactualizado
(API de `Camera` en vez de `CameraView`, `MediaTypeOptions`, etc.). No sirve como referencia
para SDK 57.

### D2. Consultar, pedir y el hook

**a) `get…PermissionsAsync()` vs `request…PermissionsAsync()`**

`get…PermissionsAsync()` **sólo lee** el estado actual: nunca muestra un diálogo y no tiene
ningún efecto visible. Sirve para decidir qué dibujar al entrar a una pantalla.

`request…PermissionsAsync()` es la única que **puede** mostrar el diálogo del sistema, y sólo
lo hace si corresponde: si el permiso ya está concedido, o si está bloqueado
(`canAskAgain: false`), resuelve en silencio devolviendo el estado que ya había.

Las dos devuelven el mismo `PermissionResponse`, así que se leen igual.

**b) Los tres elementos del hook**

```ts
const [permiso, pedirPermiso, consultarPermiso] = Location.useForegroundPermissions();
```

1. **`permiso`** — el `PermissionResponse` actual, **o `null`**.
2. **`pedirPermiso`** — la función que muestra el diálogo (equivale a `request…Async`).
3. **`consultarPermiso`** — la función que vuelve a leer el estado sin mostrar nada (equivale a
   `get…Async`).

En el **primer render `permiso` vale `null`**, porque la consulta inicial es asíncrona. Ése es
el quinto estado que casi nadie dibuja y que rompe las apps: `permiso.status` sobre `null`
revienta. Mientras tanto la pantalla tiene que mostrar un **estado de carga** —un indicador y
un texto corto—, nunca la pantalla de “permiso denegado”: todavía no sabemos nada, y mostrar el
error sería mentirle a la persona durante un parpadeo.

**c) Si `canAskAgain` es `false`**

`request…()` **no muestra nada**: resuelve inmediatamente con el mismo `status: 'denied'` y
`canAskAgain: false`. Para el código es un *no-op* que parece una llamada normal.

El problema aparece si se lo llama en un bucle (por ejemplo, en el cuerpo de un componente o en
un `useEffect` sin dependencias): la promesa resuelve siempre, el estado cambia de identidad,
el componente se vuelve a renderizar, se vuelve a llamar… y queda un **bucle infinito de
renders**. La pantalla se congela en “Pidiendo permiso…” para siempre y el teléfono se
calienta, todo sin un solo diálogo a la vista. Por eso `pedir()` tiene que salir **de un
`onPress`**, nunca de un render.

### D3. Leé la respuesta

| Respuesta | Qué hace la app |
| --- | --- |
| `null` | **Esperar.** Es el primer render: mostrar un indicador de carga. No decidir nada todavía. |
| `{ status: 'granted', granted: true }` | **Usar el recurso.** Mostrar la cámara, leer la ubicación, programar la notificación. |
| `{ status: 'undetermined', canAskAgain: true }` | **Nunca pidió nada todavía.** Mostrar la pantalla previa con el beneficio y un botón “Continuar” que dispare `request…()`. |
| `{ status: 'denied', canAskAgain: true }` | **Dijo que no una vez (Android).** Mostrar la alternativa y dejar un camino para reintentar, pero **sólo si la persona vuelve a tocar la función**. No insistir sola. |
| `{ status: 'denied', canAskAgain: false }` | **Bloqueado.** El diálogo no va a aparecer más: explicar cómo activarlo, ofrecer “Abrir Ajustes” (`Linking.openSettings()`) y dejar la alternativa funcionando. |
| `{ status: 'granted', accessPrivileges: 'limited' }` | **Concedido a medias (iOS, fotos).** Trabajar con las fotos elegidas, decirlo en la interfaz y ofrecer “elegir más fotos” (`presentPermissionsPickerAsync()`) en vez de tratarlo como un error. |
| `{ status: 'granted', android: { accuracy: 'coarse' } }` | **Concedido, pero aproximado.** Degradar la función con elegancia: mostrar “Ubicación aproximada” en vez de coordenadas, no prometer precisión que no hay. |

**Los dos campos que deciden casi todo:**

- **`granted`** (o `status === 'granted'`) responde **“¿puedo usar el recurso ahora?”**.
- **`canAskAgain`** responde **“¿tiene sentido que muestre el diálogo?”** — y por lo tanto
  decide si el botón dice **“Continuar”** o **“Abrir Ajustes”**.

Todo lo demás (`accessPrivileges`, `android.accuracy`, `ios.scope`, `expires`) es matiz: sirve
para ajustar *cómo* se usa el recurso, no *si* se puede usar.

### D4. Simulación del ciclo completo

**Android 14, app recién instalada, `expo-location`:**

| # | Acción | `status` | `canAskAgain` | ¿Diálogo? |
| --- | --- | --- | --- | --- |
| 1 | `getForegroundPermissionsAsync()` | `'undetermined'` | `true` | **No** — `get…` nunca muestra nada. |
| 2 | `requestForegroundPermissionsAsync()` → “No permitir” | `'denied'` | `true` | **Sí** (primer rechazo). |
| 3 | `requestForegroundPermissionsAsync()` → “No permitir” | `'denied'` | **`false`** | **Sí** (segundo y último). |
| 4 | `requestForegroundPermissionsAsync()` | `'denied'` | `false` | **No.** Resuelve en silencio: ya está bloqueado. |
| 5 | `Linking.openSettings()` → “Mientras la app está en uso” → vuelve y consulta | `'granted'` | `true` | **No** — el cambio se hizo en Ajustes. (Android además mató y reinició el proceso al revocar/conceder.) |
| 6 | Igual que el 5, pero la app **no** vuelve a consultar | — | — | La pantalla sigue mostrando **“bloqueado”** con el botón “Abrir Ajustes”, aunque el permiso ya esté concedido. Es el bug clásico: el estado quedó en memoria. Se arregla volviendo a consultar cuando `AppState` pasa a `'active'`. |

**Los mismos pasos 1 a 4 en iOS:**

El resultado cambia en el **paso 3**. En iOS, el diálogo se muestra **una sola vez**: el “No
permitir” del paso 2 ya deja `status: 'denied'` **y `canAskAgain: false`**. Así que en el paso
3 no aparece ningún diálogo (y en el 4 tampoco). La causa es de diseño: iOS entiende que si la
persona ya dijo que no, volver a preguntar es insistir; Android prefiere dar una segunda
oportunidad por si el primer “no” fue un reflejo.

| # | Acción | `status` | `canAskAgain` | ¿Diálogo? |
| --- | --- | --- | --- | --- |
| 1 | `getForegroundPermissionsAsync()` | `'undetermined'` | `true` | No |
| 2 | `request…()` → “No permitir” | `'denied'` | **`false`** | **Sí** (la única vez) |
| 3 | `request…()` | `'denied'` | `false` | **No** |
| 4 | `request…()` | `'denied'` | `false` | **No** |

**¿Y si en iOS elige “Permitir una vez”?** Mientras la app está en uso, `status` vale
`'granted'` y todo funciona normal. Pero el permiso es **temporal**: al cerrar la app (o dejarla
un rato en segundo plano) iOS lo descarta, y al reabrirla el estado vuelve a
**`'undetermined'`**, no a `'denied'`. O sea: el diálogo puede volver a aparecer, y la app no
debe cachear “ya tengo ubicación” entre sesiones. Hay que consultar el permiso **en cada
arranque**.

### D5. Configurar `app.json`

Una app que lee QR con la cámara pero no graba video, usa ubicación sólo en primer plano y no
debe declarar `SYSTEM_ALERT_WINDOW`:

```jsonc
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Usamos la cámara para leer el QR del punto de reciclaje.",
          // Sin micrófono: no se escribe NSMicrophoneUsageDescription en el Info.plist.
          "microphonePermission": false,
          // Sin RECORD_AUDIO en Android: el plugin lo agrega a blockedPermissions.
          "recordAudioAndroid": false
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission":
            "Usamos tu ubicación para mostrarte los puntos de reciclaje más cercanos.",
          // Las dos claves de "siempre" se omiten del Info.plist.
          "locationAlwaysAndWhenInUsePermission": false,
          "locationAlwaysPermission": false,
          // Y en Android no se declara ACCESS_BACKGROUND_LOCATION.
          "isAndroidBackgroundLocationEnabled": false,
          "isAndroidForegroundServiceEnabled": false
        }
      ]
    ],
    "android": {
      "blockedPermissions": [
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_BACKGROUND_LOCATION"
      ]
    }
  }
}
```

**¿Por qué `expo-camera` agrega `RECORD_AUDIO` en Android aunque la app no grabe sonido?**

Porque el módulo trae la grabación de video completa, con audio, y el manifiesto de la
**librería** declara los permisos de todo lo que el módulo *puede* hacer, no de lo que tu app
*hace*. El *manifest merger* de Gradle fusiona el manifiesto de cada dependencia con el de la
app, así que `RECORD_AUDIO` termina en el APK aunque nunca llames a `recordAsync()`. Resultado:
la ficha de Play dice “Micrófono” y la persona ve un permiso que no se usa.

`recordAudioAndroid: false` lo resuelve generando el `tools:node="remove"` correspondiente.

### D6. Expo Go no es tu app

**a)** Porque en Expo Go la app que corre **es Expo Go**, no la tuya. Tu proyecto es JavaScript
que Expo Go interpreta: el binario, con su `Info.plist` y su `AndroidManifest.xml`, es el de
Expo Go, compilado por Expo meses antes con textos genéricos para todos los módulos que trae.
Tu `app.json` no puede cambiar el `Info.plist` de otra app. Por eso el diálogo dice “Expo Go
quiere acceder a la cámara” con el texto de Expo, y lo mismo pasa con `blockedPermissions`: no
tiene ningún efecto.

**b)** En Expo Go se puede probar **la lógica de permisos**: los cuatro estados, las pantallas
previas, qué pasa al denegar, el regreso de Ajustes, las alternativas. Lo que **no** se puede
probar es lo que depende del binario: los textos de propósito propios, la lista real de
permisos del manifiesto, los módulos nativos que Expo Go no incluye y la configuración de los
config plugins.

Dos casos concretos:
- **Push en Android:** desde SDK 53 las notificaciones *push remotas* de Android **no funcionan
  en Expo Go**; hace falta una development build (con su propio `google-services.json` / FCM).
  Las notificaciones **locales** programadas sí andan, que es lo que usa este TP.
- **Ubicación en segundo plano:** necesita `ACCESS_BACKGROUND_LOCATION` y el *foreground
  service* declarados en **tu** manifiesto, más tareas registradas con `expo-task-manager`. Eso
  no existe en Expo Go: hay que compilar.

**c) Comandos**

```bash
# Ver los archivos nativos generados (crea ./android y ./ios desde app.json)
npx expo prebuild
npx expo prebuild --clean          # los borra y los regenera desde cero

# Compilar una development build de Android
npx expo run:android               # local; necesita Android Studio y un SDK instalado
eas build --profile development --platform android   # en la nube, con EAS
```

**d) Volver un permiso a “sin decidir” sin reinstalar**

```bash
# Android (adb)
adb shell pm reset-permissions                                   # todos los permisos de todas las apps
adb shell pm revoke ar.edu.ipf.mantenimiento android.permission.CAMERA   # uno solo

# Simulador de iOS (xcrun simctl)
xcrun simctl privacy booted reset all ar.edu.ipf.mantenimiento   # todos los de esa app
xcrun simctl privacy booted reset camera ar.edu.ipf.mantenimiento # sólo la cámara
```

(Ojo: `pm revoke` deja el permiso en “denegado”, no en “sin decidir”;
`pm reset-permissions` sí vuelve al estado inicial.)

---

## Parte E · Recetas: leer y corregir código

### E1. Encontrá los errores (cámara)

**Los problemas del código original:**

1. **`permiso` puede ser `null` y el código no lo contempla.** En el primer render
   `useCameraPermissions()` devuelve `null`, así que `permiso.status` lanza
   *“Cannot read property 'status' of null”*. La pantalla se cae antes de dibujar nada. Falta
   el estado **cargando**.
2. **No distingue “denegado” de “bloqueado”.** Si `canAskAgain` es `false`, el botón “Permitir”
   llama a `pedirPermiso()`, que resuelve en silencio sin mostrar ningún diálogo. Para la
   persona, el botón simplemente no hace nada. Falta el estado **bloqueado** con “Abrir
   Ajustes”.
3. **No hay alternativa.** Si la cámara se deniega, la pantalla queda en un callejón sin
   salida: no se puede escribir el código del aula a mano, y la tarea queda bloqueada por un
   permiso.
4. **El botón dice “Permitir”.** Ese es el botón del sistema, no el tuyo. El de la pantalla
   previa tiene que decir “Continuar”: la app no concede nada.
5. **`onPress={pedirPermiso}`** le pasa el evento de pulsación como argumento a la función de
   permiso. Hoy no rompe, pero es incorrecto: conviene `onPress={() => pedirPermiso()}`.
6. **No se entera de los cambios hechos en Ajustes:** si la persona activa la cámara desde
   Ajustes y vuelve, la pantalla sigue mostrando la explicación.

**Versión corregida, con los cuatro estados:**

```tsx
// src/app/escanear.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';

import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';

export default function Escanear() {
  const [permiso, pedirPermiso, consultarPermiso] = useCameraPermissions();

  // Si la persona cambia el permiso en Ajustes, nos enteramos al volver.
  useRevisarAlVolver(useCallback(() => { void consultarPermiso(); }, [consultarPermiso]));

  // 1 · cargando — todavía no sabemos nada
  if (!permiso) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <ActivityIndicator />
        <Text>Revisando el permiso de cámara…</Text>
      </View>
    );
  }

  // 2 · concedido
  if (permiso.granted) {
    return <CameraView style={{ flex: 1 }} facing="back" />;
  }

  // 3 · bloqueado — el diálogo ya no va a aparecer
  if (!permiso.canAskAgain) {
    return (
      <Explicacion texto="La cámara está bloqueada para esta app. Se activa desde Ajustes › Mantenimiento IPF › Cámara.">
        <Boton titulo="Abrir Ajustes" onPress={() => { void Linking.openSettings(); }} />
        <CodigoAMano />
      </Explicacion>
    );
  }

  // 4 · preguntable — sin decidir, o denegado con segunda oportunidad
  return (
    <Explicacion texto="Usamos la cámara para leer el QR del aula y completar el campo solo.">
      <Boton titulo="Continuar" onPress={() => { void pedirPermiso(); }} />
      <CodigoAMano />
    </Explicacion>
  );
}
```

Lo importante: **en los cuatro estados la pantalla sirve para algo**. `<CodigoAMano />` es la
alternativa, y está siempre disponible — el permiso nunca es la única puerta.

La versión que corre en este repositorio es
[`src/app/reporte/escanear.tsx`](./src/app/reporte/escanear.tsx), que además delega la
explicación en la pantalla previa `/permisos/[recurso]`.

### E2. El orden importa (ubicación)

**a) ¿Qué está mal?**

Pide el permiso de **segundo plano antes** que el de primer plano. Eso está al revés: el
permiso de background es una *ampliación* del de foreground, no un reemplazo.

- **En iOS:** `requestBackgroundPermissionsAsync()` sin tener el de primer plano concedido no
  muestra el diálogo de “Siempre”. iOS exige la escalera: primero “Al usar la app”, y recién
  después se puede pedir “Siempre” (y ese segundo diálogo iOS lo muestra cuando quiere, incluso
  más tarde y por su cuenta). La función devuelve denegado y corta antes de pedir lo que sí
  habría concedido la persona.
- **En Android 11+:** peor todavía. Desde Android 11, `ACCESS_BACKGROUND_LOCATION` **no se
  puede pedir con un diálogo**: el sistema obliga a mandar a la persona a Ajustes para elegir
  “Permitir todo el tiempo”. Y si el permiso de primer plano no está concedido, la solicitud se
  deniega al instante, con `canAskAgain: false`. El usuario no ve nada y la función devuelve
  `false`.

Encima, el código pide segundo plano para una app que probablemente no lo necesita — lo que
agrega una revisión extra en Google Play.

**b) Reescritura:**

```ts
// src/lib/ubicacion.ts
import * as Location from 'expo-location';

export async function activarSeguimiento(): Promise<boolean> {
  // 1 · Primero el primer plano. Sin esto, lo demás no tiene sentido.
  const enUso = await Location.requestForegroundPermissionsAsync();
  if (!enUso.granted) return false;

  // 2 · Recién ahora, y sólo si la función de verdad lo necesita,
  //     pedimos el segundo plano. En Android 11+ esto abre Ajustes.
  const siempre = await Location.requestBackgroundPermissionsAsync();
  return siempre.granted;
}
```

Y lo que la función debería devolver, en realidad, no es un `boolean` sino el nivel alcanzado,
para que la pantalla pueda ofrecer la versión reducida en vez de fallar:

```ts
export async function activarSeguimiento(): Promise<'ninguno' | 'enUso' | 'siempre'> {
  const enUso = await Location.requestForegroundPermissionsAsync();
  if (!enUso.granted) return 'ninguno';

  const siempre = await Location.requestBackgroundPermissionsAsync();
  return siempre.granted ? 'siempre' : 'enUso';
}
```

**c) `obtenerUbicacion()`**

Es la que está en producción en este repo
([`src/lib/ubicacion.ts`](./src/lib/ubicacion.ts)):

```ts
import * as Location from 'expo-location';

export type Ubicacion = { latitud: number; longitud: number; aproximada: boolean };

export function esAproximada(respuesta: Location.LocationPermissionResponse | null): boolean {
  if (!respuesta?.granted) return false;
  if (respuesta.android) return respuesta.android.accuracy === 'coarse';  // Android 12+
  if (respuesta.ios) return respuesta.ios.accuracy === 'reduced';         // iOS 14+
  return false;
}

export async function obtenerUbicacion(): Promise<Ubicacion | null> {
  try {
    const permiso = await Location.getForegroundPermissionsAsync();
    if (!permiso.granted) return null;            // denegado: null, sin romper nada

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
    return null;   // sin señal, GPS apagado, timeout: también es null
  }
}
```

Tres decisiones: consulta (`get…`) en vez de pedir —pedir es trabajo de la pantalla previa—,
`try/catch` alrededor de todo, y `null` como único valor de fracaso, para que quien la llame no
tenga que distinguir “denegado” de “no hay señal”: en los dos casos se cae a elegir el sector a
mano.

**d) ¿Hace falta segundo plano para “farmacias cercanas”?**

**No.** La persona abre la app, mira la lista, cierra la app. La ubicación se lee una sola vez,
con la pantalla encendida: alcanza y sobra con el permiso de primer plano. Pedir “Siempre” para
eso es pedir mucho más de lo necesario, y la gente lo nota.

Si igual se pidiera, **Google Play exige**: declarar el uso en el formulario de permisos
sensibles del Play Console, demostrar que la función principal **no funciona** sin background,
grabar un **video** mostrando la función y el flujo de permiso, y pasar una revisión manual que
puede rechazar la app. Además hay que mostrar una explicación propia antes de mandar a Ajustes.
Mucho costo para algo que no se necesita.

### E3. Notificaciones mudas

**a) Causa más probable y qué hacer antes**

En Android, `expo-notifications` necesita que exista un **canal de notificación** antes de
poder mostrar nada, y la solicitud de `POST_NOTIFICATIONS` queda muda si no hay ninguno. Hay
que crear el canal **antes** de pedir el permiso:

```ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('reportes', {
    name: 'Reportes',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}
const respuesta = await Notifications.requestPermissionsAsync();
```

Las otras dos causas que dan el mismo síntoma, y que conviene descartar:
- **El permiso ya está bloqueado** (`canAskAgain: false`), porque se probó antes y se dijo que
  no dos veces. Hay que consultar primero con `getPermissionsAsync()` y mirar `canAskAgain`.
- **Se está probando en Expo Go**, donde el módulo está limitado.

(Lo que *no* suele fallar es la declaración: `expo-notifications` ya declara
`POST_NOTIFICATIONS` en su propio manifiesto, y el *manifest merger* lo incorpora. Por eso el
permiso **no** aparece en `android/app/src/main/AndroidManifest.xml` después de `prebuild` y
sin embargo está en el APK.)

**b) En Android 12 o anterior**

`POST_NOTIFICATIONS` no existe: las notificaciones se conceden solas al instalar.
`requestPermissionsAsync()` devuelve `granted: true` sin mostrar ningún diálogo. El código no
cambia —se pide igual y funciona—, pero hay que saber que ahí la persona nunca eligió: puede
apagarlas desde Ajustes y la app se entera recién al consultar.

**c) La opción de iOS sin diálogo**

Las **notificaciones provisionales**, desde iOS 12:

```ts
const respuesta = await Notifications.requestPermissionsAsync({
  ios: { allowProvisional: true },
});
```

Los avisos empiezan a llegar **sin ningún diálogo**, pero en silencio: van directo al centro de
notificaciones, sin banner ni sonido, y cada uno trae botones “Mantener” / “Desactivar”. Es la
persona la que decide después, con avisos reales en la mano.

Se detecta en código así:

```ts
const provisional =
  respuesta.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
```

Importante: con autorización provisional `granted` puede venir en `false`, así que el chequeo
tiene que ser `granted || provisional`. En este repo eso está en `puedeAvisar()`, en
[`src/lib/notificaciones.ts`](./src/lib/notificaciones.ts).

**d) ¿En qué momento conviene pedirlo?**

Cuando la persona acaba de hacer algo cuyo resultado va a querer saber. El permiso tiene que
ser la continuación natural de una acción suya.

- **Buen momento:** acaba de cargar un reporte de mantenimiento y activa el interruptor
  “Avisarme cuando se resuelva”. El beneficio es evidente porque *ella* lo pidió. (Es
  exactamente lo que hace `/ajustes-app` en la Parte G.)
- **Mal momento:** en la pantalla de bienvenida, antes de que haya pasado nada, junto con otros
  tres permisos. Ahí el “No permitir” es casi automático, y en iOS ese “no” es para siempre.

### E4. Fotos sin pedir permiso

| Necesidad | Herramienta | Permiso |
| --- | --- | --- |
| Elegir una foto de perfil | `ImagePicker.launchImageLibraryAsync()` — el selector del sistema | **Ninguno.** El selector corre fuera de la app y devuelve sólo la imagen elegida. |
| Sacar una foto en el momento | `ImagePicker.launchCameraAsync()` o `CameraView` de `expo-camera` | **Cámara** (`CAMERA` / `NSCameraUsageDescription`). |
| Editor que muestra toda la galería | `expo-media-library` | **Galería completa** (`READ_MEDIA_IMAGES` / `NSPhotoLibraryUsageDescription`), leyendo `accessPrivileges` por si es `'limited'`. |
| Adjuntar la foto de un comprobante | `ImagePicker.launchImageLibraryAsync()` | **Ninguno.** |

**¿Por qué Google Play restringe `READ_MEDIA_IMAGES` y `READ_MEDIA_VIDEO`?**

Porque dan acceso a **toda** la biblioteca de fotos y videos del teléfono —que es de lo más
sensible que tiene una persona— cuando la enorme mayoría de las apps sólo necesita *una*
imagen. La política los declara permisos de acceso amplio: sólo se aprueban si la función
principal de la app es administrar o editar la fototeca completa, y hay que justificarlo en el
Play Console. Si la app sólo adjunta o sube una foto, Google exige usar el **photo picker** del
sistema.

**¿Desde cuándo?** Los permisos nacen con **Android 13 (API 33)**, partiendo
`READ_EXTERNAL_STORAGE`; el *photo picker* del sistema llega con **Android 13** (y por
Google Play services hasta Android 4.4), el acceso parcial
(`READ_MEDIA_VISUAL_USER_SELECTED`) con **Android 14**, y la política de Google Play que
restringe su uso entró en vigor durante **2024**.

**¿Qué es “el mejor permiso”?** El que **no hace falta pedir**. Si existe un selector del
sistema que resuelve la necesidad —el photo picker, el *document picker*, el contact picker, el
selector de archivos— ése es siempre el mejor camino: no hay diálogo que la persona pueda
rechazar, no hay estado bloqueado que manejar, no hay permiso que declarar ni justificar ante
la tienda, no hay nada que auditar y la app recibe exactamente lo que la persona eligió darle.
Permiso que no pedís es permiso que no te pueden negar.

### E5. Volver de Ajustes

**El hook completo** (está en [`src/hooks/useRevisarAlVolver.ts`](./src/hooks/useRevisarAlVolver.ts)):

```ts
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

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
```

Los tres espacios eran:
1. `anterior.current === 'background' || anterior.current === 'inactive'`
2. `nuevo === 'active'`
3. `sub.remove()`

El `useRef` es necesario porque hace falta comparar el estado **anterior** con el nuevo: sin
él, cualquier transición a `'active'` dispararía la consulta, incluso al montar.

**a) ¿Por qué los hooks de Expo no se enteran solos?**

Porque guardan la última respuesta que leyeron en un `useState` y sólo la actualizan cuando
alguien llama a `get…`/`request…`. Ajustes es **otra app**: el cambio ocurre fuera del proceso
de la tuya (en Android, encima, el proceso se mata y reinicia), y el sistema no emite ningún
evento de “cambió un permiso” al que React pueda suscribirse. El único momento observable es la
vuelta al primer plano, y eso lo informa `AppState`.

**b) ¿Qué función le pasarías?**

La **tercera** del hook de cámara: `consultarPermiso` (el `get…`), nunca la segunda
(`pedirPermiso`). Volver del segundo plano no es una acción de la persona sobre la función: si
ahí se llamara a `request…()`, la app estaría pidiendo permiso sin que nadie se lo pidiera, y
en el caso bloqueado además en un bucle silencioso.

```tsx
const [permiso, pedirPermiso, consultarPermiso] = useCameraPermissions();
useRevisarAlVolver(useCallback(() => { void consultarPermiso(); }, [consultarPermiso]));
```

**c) ¿Por qué no guardar el estado en un store global “para siempre”?**

Porque el permiso **no es un dato de la app, es un dato del sistema**, y el sistema lo puede
cambiar en cualquier momento sin avisar: desde Ajustes, con un “Permitir una vez” que vence al
cerrar la app, con el reseteo automático de permisos de apps sin usar (Android 11+), o con una
restauración de copia de seguridad. Un valor cacheado “para siempre” se desincroniza y produce
los dos peores bugs posibles: mostrar “bloqueado” cuando ya está concedido, o intentar abrir la
cámara con un permiso revocado.

La fuente de verdad tiene que ser siempre el sistema. Lo que sí se puede guardar —y en esta app
se guarda— es la **intención de la persona** (“quiero recibir avisos”), que es un dato propio;
el permiso se consulta aparte, cada vez.

---

## Parte F · Buenas prácticas y tiendas

### F1. Pedir en contexto

| App y permiso | ¿Cuándo pedirlo? | Alternativa si lo deniegan |
| --- | --- | --- |
| **Delivery · ubicación** | Cuando toca “Usar mi ubicación actual” en la pantalla de dirección de entrega. Nunca al abrir la app. | Escribir la dirección a mano, elegir una guardada o marcar el punto en el mapa. |
| **Billetera virtual · cámara** | Cuando toca “Pagar con QR” o “Escanear código”. | Escribir el alias/CVU a mano, pegar el código desde el portapapeles, mostrar el **propio** QR para que lo escaneen. |
| **Red social · contactos** | Cuando toca “Buscar gente que conozco” en la sección de amigos, y sólo si la busca. | Buscar por nombre de usuario, compartir el perfil por link, importar desde otra red. |
| **Mensajería · micrófono** | Cuando mantiene apretado el botón de audio para grabar el primer mensaje de voz. | Escribir el mensaje, adjuntar un archivo de audio ya grabado. |
| **Turnos médicos · notificaciones** | Después de confirmar el primer turno, al ofrecer “Avisame un día antes”. | Mostrar los recordatorios dentro de la app, ofrecer “agregar al calendario” o un mail. |
| **Editor de fotos · galería completa** | Cuando elige “Abrir álbum completo” para trabajar sobre varias fotos a la vez. | El selector del sistema: elegir una foto por vez, sin ningún permiso. |

**¿Por qué pedir cuatro permisos al abrir “entrena el No permitir automático”?**

Porque la persona no tiene con qué decidir. Todavía no vio la app, no sabe qué hace cada
permiso ni qué gana dando el sí, y tiene cuatro diálogos encima. Frente a esa pila, la salida
más rápida —y la más racional— es tocar “No permitir” cuatro veces: es el botón que hace
desaparecer la interrupción sin riesgo aparente.

El problema es que ese reflejo se entrena. Después de hacerlo unas cuantas veces en varias
apps, la persona rechaza **antes de leer**, incluso cuando el permiso venía bien justificado y
en el momento correcto. Y el costo es permanente: en iOS ese “no” es definitivo, y en Android
dos de esos rechazos dejan el permiso bloqueado. La app se queda sin cámara para siempre
porque la pidió cinco segundos antes de tiempo.

Pedir en contexto es lo contrario: un permiso por vez, justo cuando la persona tocó la función
que lo necesita, de modo que el diálogo sea la respuesta a algo que ella acaba de pedir.

### F2. La pantalla previa

**a) Los tres elementos**

1. **Qué recurso se va a pedir**, dicho con las mismas palabras que va a usar el diálogo del
   sistema (“cámara”, “ubicación”), para que no haya sorpresa.
2. **Para qué sirve, con un beneficio concreto para la persona** — una frase, con el molde
   “Usamos tu *[dato]* para *[beneficio concreto]*”. No el motivo técnico: el beneficio.
3. **Un único botón de avance** (“Continuar”), que dispara el diálogo del sistema. Idealmente,
   además, la aclaración de que se puede cambiar después desde Ajustes, y qué pasa si dice que
   no.

**b) ¿Por qué “Continuar” y no “Permitir”?**

Porque tu app **no concede** nada: el que concede es el sistema, en la pantalla siguiente. Un
botón que dice “Permitir” promete algo que no puede cumplir y, peor, se confunde con el botón
real del diálogo: la persona cree que ya aceptó, toca “Permitir” en tu pantalla y después, en
el diálogo de verdad, no entiende por qué le vuelven a preguntar — o toca “No permitir”
pensando que está cancelando un paso repetido. “Continuar” describe lo que de verdad hace el
botón: avanzar al diálogo.

**c) La pauta 5.1.1(iv) de Apple**

Prohíbe condicionar el funcionamiento de la app a que la persona conceda un permiso que no es
necesario para la función principal: no se puede bloquear el acceso ni degradarlo como castigo
por decir que no. En la práctica, para la pantalla previa, eso significa que la persona tiene
que poder **salir sin conceder**: un “Ahora no”, un “Cerrar”, el gesto de cierre del modal o el
botón de volver. Una previa con un solo camino, del que no se sale sin tocar “Continuar”, es
una pantalla bloqueante y Apple la rechaza.

> En este TP la consigna pide explícitamente un único botón “Continuar”, sin “Ahora no” ni
> “Cerrar”. La forma de cumplir las dos cosas es la que usa la app: la previa es un **modal**,
> así que la persona siempre puede cerrarla con el gesto del sistema o la flecha de volver —no
> hay un botón de rechazo agregado por nosotros, pero tampoco hay encierro— y, además, todas
> las funciones tienen alternativa sin permiso.

**d) ¿Cómo cambia si el permiso ya está bloqueado?**

Cambia entera, porque el diálogo ya no va a aparecer y “Continuar” no haría nada:

- El **texto** pasa de explicar el beneficio a explicar la **situación** y el camino: “La cámara
  está bloqueada para esta app. Se activa en Ajustes › Mantenimiento IPF › Cámara”, con la ruta
  exacta de cada plataforma.
- El **botón** pasa a ser **“Abrir Ajustes”**, con `Linking.openSettings()`.
- Hay que **volver a consultar al regresar** (`AppState`), porque si no la pantalla sigue
  mostrando “bloqueado” después de que la persona lo activó.
- Y conviene recordar la **alternativa**, que es lo que le permite seguir sin ir a Ajustes.

### F3. Mínimo privilegio

**a) “Puntos de reciclaje de tu barrio”: ¿precisa o aproximada?**

**Aproximada** (`ACCESS_COARSE_LOCATION`). Un barrio mide bastante más que los ~3 km² de margen
de la ubicación aproximada, así que alcanza para ordenar los puntos de reciclaje de más cerca a
más lejos y para centrar el mapa. La precisa sólo haría falta para decir “estás a 40 metros del
contenedor”, que no es lo que la función promete. Pedir menos, además, hace que mucha más gente
diga que sí.

**b) “Registrar una carrera con el celular en el bolsillo”: ¿“en uso” o “siempre”?**

**“En uso”**, combinado con un *foreground service* (`isAndroidForegroundServiceEnabled: true`
en el plugin de `expo-location`, más `UIBackgroundModes: location` en iOS). Con la pantalla
apagada y el teléfono en el bolsillo, la app sigue contando como “en uso” mientras el servicio
en primer plano esté activo y con su notificación visible. “Siempre” es para apps que leen la
ubicación cuando la persona **no** está usándolas (una geocerca que avisa al llegar a un
lugar), y arrastra la revisión manual de Google Play.

**c) “Subir la foto del DNI”: ¿selector del sistema o permiso de galería?**

**Selector del sistema** (`ImagePicker.launchImageLibraryAsync()`). Se sube **una** foto: no
hay ninguna razón para ver el resto de la fototeca. Sin permiso no hay diálogo, no hay estado
bloqueado, no hay justificación ante la tienda y —en un trámite con el DNI— la persona entrega
exactamente lo que quiso entregar, lo cual también es más fácil de explicar.

**d) “Escanear el QR del aula”: ¿`expo-camera` con o sin micrófono?**

**Sin micrófono**: `microphonePermission: false` y `recordAudioAndroid: false`. Leer un QR es
procesar imagen; el audio no participa. Dejarlo activado agregaría `RECORD_AUDIO` al manifiesto
y `NSMicrophoneUsageDescription` al `Info.plist`, con dos consecuencias feas: la ficha de Play
diría “Micrófono” en una app que no graba nada, y Apple podría pedir que justifiques una API
que nunca llamás.

### F4. Tiendas

**a) Dos requisitos de cada tienda**

**Google Play**
1. **Sección “Seguridad de los datos”** completa y veraz en la ficha: qué datos recolecta la
   app, para qué, si los comparte, si se pueden borrar. Lo que se declara tiene que coincidir
   con los permisos del manifiesto y con lo que la app hace de verdad.
2. **Política de permisos sensibles**: ubicación en segundo plano, `MANAGE_EXTERNAL_STORAGE`,
   `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO`, SMS y registro de llamadas exigen que el permiso sea
   necesario para la **función principal**, declararlo en un formulario del Play Console y
   —para varios de ellos— un video demostrativo y una revisión manual. (A esto se suma la
   exigencia de `targetSdkVersion`, hoy API 36 desde el 31/08/2026.)

**App Store**
1. **Pauta 5.1.1**: cada permiso necesita un texto de propósito específico que explique el uso y
   el beneficio; y la app no puede bloquearse ni castigar a quien diga que no (5.1.1 iv).
2. **Etiquetas de privacidad (“Privacy Nutrition Labels”) y manifiesto de privacidad**:
   declarar en App Store Connect qué datos se recolectan y si se usan para rastreo, más el
   `PrivacyInfo.xcprivacy` con los motivos de uso de las *required reason APIs*. El rastreo
   entre apps además obliga a pedir ATT.

**b) El manifiesto de privacidad (`PrivacyInfo.xcprivacy`)**

Es un archivo que Apple exige dentro del binario (y dentro de cada SDK de terceros) desde la
primavera de 2024. Declara, en formato *plist*:
- qué **tipos de datos** recolecta la app y con qué fin;
- si esos datos se usan para **rastreo**;
- los **dominios de rastreo** que hay que bloquear si la persona no da ATT;
- y los **motivos de uso** de las *required reason APIs* (las que Apple vigila porque se usaron
  para *fingerprinting*: `UserDefaults`, marcas de tiempo de archivos, espacio en disco, estado
  del teclado…), cada uno con un código de motivo aprobado.

Sin él, o con motivos que no corresponden, App Store Connect rechaza la build.

En **Expo** se configura en `app.json`, con la clave **`expo.ios.privacyManifests`**:

```jsonc
{
  "expo": {
    "ios": {
      "privacyManifests": {
        "NSPrivacyAccessedAPITypes": [
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
            // CA92.1 = "acceder a los datos de la propia app"
            "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]
          }
        ],
        "NSPrivacyTracking": false,
        "NSPrivacyTrackingDomains": [],
        "NSPrivacyCollectedDataTypes": []
      }
    }
  }
}
```

`npx expo prebuild` lo escribe en `ios/<Proyecto>/PrivacyInfo.xcprivacy`. Los SDK de terceros
(Expo incluido) traen el suyo propio, que se suma al de la app.

**c) Android 17 y Google Play desde el 27/01/2027**

**Qué suma Android 17 (API 37):**
- **`ACCESS_LOCAL_NETWORK` pasa a ser obligatorio.** Lo que en Android 16 era *opt-in* (y se
  pedía prestado a `NEARBY_WIFI_DEVICES`) se vuelve un permiso de tiempo de ejecución con
  nombre propio, dentro del grupo `NEARBY_DEVICES`. Toda app que apunte a API 37+ y hable con
  dispositivos de la red local —mDNS, SSDP, sockets crudos a direcciones locales— queda
  **bloqueada por defecto** hasta que lo declare y lo pida. Las apps que apuntan a menos de 37
  reciben una concesión implícita y **temporal**; la recomendación oficial es no pedirlo al
  runtime hasta apuntar a 37.
- **Los contactos se restringen.** Las apps que apunten a API 37+ sólo pueden pedir
  `READ_CONTACTS` si el **selector de contactos del sistema** (Android Contact Picker) no
  alcanza para su función principal — la misma lógica del *photo picker* aplicada a la agenda.

**Qué exige Google Play desde el 27/01/2027:** a partir de esa fecha, una app que apunte a
API 37 o más y siga declarando `READ_CONTACTS` tiene que presentar una **declaración en el Play
Console** justificando por qué el Contact Picker no le sirve. Sin esa declaración aprobada, la
app no se puede publicar ni actualizar. Quien no llegue con los tiempos puede pedir una
**prórroga automática de 30 días** desde el Play Console.

En resumen, el mismo patrón de siempre, una vuelta más: **el selector del sistema primero, el
permiso sólo si no queda otra, y con justificación**.

### F5. Errores comunes

**a) “This app has crashed because it attempted to access privacy-sensitive data without a
usage description.”**

- **Causa:** falta la clave de propósito en el `Info.plist` para la API que se tocó. iOS no
  devuelve un error: mata el proceso. En Expo, el motivo típico es que el config plugin del
  módulo no está en `plugins`, o que su texto se puso en `false` y después alguien usó esa
  función igual (por ejemplo `microphonePermission: false` y luego grabar video con audio).
- **Solución:** agregar el plugin con su texto en `app.json` y **recompilar**
  (`npx expo prebuild --clean` + una build nueva). El mensaje de Xcode nombra la clave que
  falta: ésa es la que hay que agregar. Una OTA no lo arregla.

**b) “En Expo Go anda, en la build no”: la cámara se deniega sin mostrar diálogo**

- **Causa:** el permiso no está declarado en **tu** binario. En Expo Go funcionaba porque el
  manifiesto de Expo Go declara `CAMERA`; en tu build, no. Android, al no encontrar el permiso
  en el manifiesto, deniega al instante y sin diálogo (`canAskAgain: false`). La causa más
  frecuente en Expo es un `blockedPermissions` demasiado entusiasta, o un plugin con
  `cameraPermission: false`, que agrega el `tools:node="remove"`.
- **Solución:** revisar `app.json`, correr `npx expo prebuild --clean` y mirar el
  `android/app/src/main/AndroidManifest.xml` generado: el permiso tiene que estar, y **sin**
  `tools:node="remove"`. Recompilar. (Auditar el manifiesto generado debería ser parte de la
  rutina antes de publicar.)

**c) Después de habilitar la ubicación en Ajustes, la app sigue diciendo “bloqueado”**

- **Causa:** la app está mostrando un estado que leyó antes y nunca volvió a consultar. El hook
  de Expo guarda la última respuesta en memoria, y el cambio ocurrió en otra app.
- **Solución:** volver a consultar (`get…PermissionsAsync()` o la tercera función del hook)
  cuando `AppState` pasa a `'active'`. Es exactamente `useRevisarAlVolver`. Lo que **no** hay
  que hacer es llamar a `request…()` ahí.

**d) La pantalla queda en “Pidiendo permiso…” para siempre**

- **Causa:** `request…()` se llama en cada render (en el cuerpo del componente, o en un
  `useEffect` sin array de dependencias). Cada llamada resuelve, cambia el estado, provoca un
  render nuevo y vuelve a llamar: bucle infinito. Si además está bloqueado, ni siquiera aparece
  un diálogo que delate el problema.
- **Solución:** pedir **sólo desde un `onPress`**. En el render se **consulta** (`get…`), nunca
  se pide. Y el estado de carga se deriva de `permiso === null`, no de una bandera propia.

**e) Una app de turnos no deja entrar a ninguna pantalla si se deniegan las notificaciones**

- **Causa:** se trató un permiso **accesorio** como si fuera un requisito. Las notificaciones
  son una comodidad —avisar sin que la persona abra la app—, no la función principal, que es
  sacar y ver turnos.
- **Solución:** dejar entrar siempre y mover el aviso adentro de la app: una bandeja de avisos,
  un badge, un recordatorio en la pantalla de inicio. Ofrecer activar las notificaciones
  después, en contexto. Además de ser mejor producto, bloquear así viola la pauta 5.1.1(iv) de
  Apple y puede costar el rechazo de la build. En este TP es el requisito 7: **la app nunca se
  bloquea**, y `/avisos` es la alternativa.

---

## Fuentes consultadas

- [Permissions · Expo Docs](https://docs.expo.dev/guides/permissions/)
- [Target API level requirements for Google Play apps](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Local network permission · Android Developers](https://developer.android.com/privacy-and-security/local-network-permission)
- [Preview: Permissions and APIs that Access Sensitive Information · Play Console Help](https://support.google.com/googleplay/android-developer/answer/16909972)
- [App Store Review Guidelines, 5.1.1 Data Collection and Storage](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
