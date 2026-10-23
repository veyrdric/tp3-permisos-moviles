# Mantenimiento IPF

App para que alumnos y docentes del Instituto Politécnico Formosa reporten desperfectos del
edificio (una luz quemada, una canilla que pierde, un proyector roto) y se enteren cuando se
resuelven.

Es la **Parte G** del Trabajo Práctico N° 3 de Taller Complementario – React Native II. Las
respuestas de las Partes A a F están en **[RESPUESTAS.md](./RESPUESTAS.md)**.

> El tema real del trabajo no es el formulario de reportes: es **cómo se piden los permisos**.
> La app usa cámara, ubicación y notificaciones, y elige fotos **sin** pedir permiso de galería.
> Ninguna función queda bloqueada si la persona dice que no.

---

## Cómo correrlo

```bash
npm install
npx expo start          # abrir con Expo Go, o con una development build
```

| Comando | Qué hace |
| --- | --- |
| `npx expo start` | Servidor de desarrollo (Expo Go o development build). |
| `npx expo prebuild --clean` | Genera `android/` e `ios/` desde `app.json`. Sirve para auditar el manifiesto. |
| `npx expo run:android` | Compila y corre una **development build** de Android. |
| `eas build --profile development --platform android` | La misma build, en la nube. |
| `npx tsc --noEmit` | Chequeo de tipos. |

**Qué se puede probar en cada entorno**

| | Expo Go | Development build |
| --- | --- | --- |
| Los cuatro estados del permiso, pantallas previas, alternativas | ✅ | ✅ |
| Volver de Ajustes y que el panel se actualice | ✅ | ✅ |
| **Tus** textos de propósito en el diálogo | ❌ (se ven los de Expo Go) | ✅ |
| El manifiesto real / `blockedPermissions` | ❌ | ✅ |
| Notificaciones locales programadas | ⚠️ limitado | ✅ |

El entorno de desarrollo (Expo SDK 57, React Native 0.86, Expo Router 57) apunta a
**Android API 36 / minSdk 24** y **iOS 16.4**.

---

## Árbol de rutas (`src/app`)

```
src/app/
├── _layout.tsx                 Stack raíz · <ProveedorStore> + el modal de la previa
├── (tabs)/
│   ├── _layout.tsx             Las tres solapas
│   ├── index.tsx               /            Inicio: mis reportes + "Nuevo reporte"
│   ├── avisos.tsx              /avisos      Bandeja de avisos (alternativa a las notificaciones)
│   └── permisos.tsx            /permisos    Panel con el estado de cada permiso
├── reporte/
│   ├── nuevo.tsx               /reporte/nuevo       Formulario. No pide ningún permiso al abrir
│   ├── escanear.tsx            /reporte/escanear    Cámara · los cuatro estados
│   ├── foto.tsx                /reporte/foto        Sacar foto (cámara) / elegir (sin permiso)
│   ├── ubicacion.tsx           /reporte/ubicacion   Ubicación en primer plano
│   └── [id].tsx                /reporte/[id]        Detalle + "Simular resolución"
├── permisos/
│   └── [recurso].tsx           /permisos/[recurso]  La pantalla previa · presentation: "modal"
├── ajustes-app.tsx             /ajustes-app         Interruptor de avisos (pide notificaciones)
└── +not-found.tsx              404
```

**Por qué el árbol es así.** `/permisos` es una solapa y `/permisos/[recurso]` es un modal del
stack raíz: son rutas distintas, no hay conflicto, y así la previa se puede abrir **encima** de
cualquier pantalla sin sacar a la persona de lo que estaba haciendo. `(tabs)` es un grupo, o
sea que no aparece en la URL: la solapa de inicio responde a `/`, no a `/tabs`.

El resto del código:

```
src/
├── components/
│   ├── pantalla-previa.tsx     La previa: beneficio + un botón. El ÚNICO lugar que llama a pedir()
│   ├── aviso-permiso.tsx       Tarjeta que una pantalla muestra cuando le falta un permiso
│   ├── estado-reporte.tsx      Chip de estado del reporte
│   └── ui.tsx                  Botones, tarjetas, campos, chips
├── hooks/
│   ├── usePermiso.ts           El hook unificado: 4 estados + matiz + pedir() + abrirAjustes()
│   └── useRevisarAlVolver.ts   AppState: volver a consultar al regresar de Ajustes
└── lib/
    ├── permisos.ts             Catálogo: textos, alternativas, rutas de Ajustes por plataforma
    ├── notificaciones.ts       Canal de Android, pedido, provisional, aviso local a los 10 s
    ├── ubicacion.ts            obtenerUbicacion() · esAproximada() · describirUbicacion()
    ├── store.tsx               Reportes, avisos y borrador (Context)
    └── tema.ts                 Colores y medidas
```

---

## El bloque `plugins` de `app.json`, comentado

```jsonc
"plugins": [
  "expo-router",
  ["expo-splash-screen", { /* … */ }],

  [
    "expo-camera",
    {
      // Texto de propósito propio → NSCameraUsageDescription.
      // Molde "Usamos tu [dato] para [beneficio concreto]".
      "cameraPermission": "Usamos la cámara para leer el QR pegado en la puerta del aula y para sacar la foto del desperfecto que estás reportando.",

      // MÍNIMO PRIVILEGIO · la app lee QR y saca fotos: nunca graba audio.
      // false omite NSMicrophoneUsageDescription del Info.plist…
      "microphonePermission": false,
      // …y saca RECORD_AUDIO del manifiesto de Android (tools:node="remove").
      "recordAudioAndroid": false
    }
  ],

  [
    "expo-location",
    {
      // Única clave de ubicación que se escribe: la de primer plano.
      "locationWhenInUsePermission": "Usamos tu ubicación para marcar en qué sector del Instituto está el desperfecto que estás reportando.",

      // MÍNIMO PRIVILEGIO · marcar un desperfecto se hace con la app abierta.
      // Nunca pedimos "Siempre": las tres claves de iOS quedan fuera del Info.plist…
      "locationAlwaysAndWhenInUsePermission": false,
      "locationAlwaysPermission": false,
      "motionUsagePermission": false,
      // …y en Android no se declara ACCESS_BACKGROUND_LOCATION ni el foreground service.
      "isIosBackgroundLocationEnabled": false,
      "isAndroidBackgroundLocationEnabled": false,
      "isAndroidForegroundServiceEnabled": false
    }
  ],

  [
    "expo-image-picker",
    {
      // false → NO se escribe NSPhotoLibraryUsageDescription.
      // Elegir una foto usa el selector del sistema, que no necesita permiso.
      "photosPermission": false,

      // Acá SÍ va texto: launchCameraAsync() usa la cámara.
      // Tiene que ser el mismo texto que el de expo-camera: los dos plugins
      // escriben la misma clave del Info.plist y gana el último.
      // (Ojo: poner false acá BLOQUEARÍA android.permission.CAMERA, que sí usamos.)
      "cameraPermission": "Usamos la cámara para leer el QR pegado en la puerta del aula y para sacar la foto del desperfecto que estás reportando.",
      "microphonePermission": false
    }
  ],

  [
    "expo-notifications",
    {
      "color": "#1D4ED8",
      // El canal de Android que la app crea antes de pedir el permiso.
      "defaultChannel": "reportes"
    }
  ]
],

"android": {
  // Cada uno de estos se justifica en la tabla de abajo.
  "blockedPermissions": [
    "android.permission.RECORD_AUDIO",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.ACCESS_BACKGROUND_LOCATION",
    "android.permission.READ_MEDIA_IMAGES",
    "android.permission.READ_MEDIA_VIDEO",
    "android.permission.READ_MEDIA_VISUAL_USER_SELECTED"
  ]
}
```

---

## Tabla de permisos

| Recurso | Módulo | ¿Cuándo se pide? | Alternativa si se deniega |
| --- | --- | --- | --- |
| **Cámara** (escanear) | `expo-camera` · `useCameraPermissions()` | Al entrar a `/reporte/escanear`, es decir después de tocar “Escanear el QR del aula”. Nunca al abrir la app ni al abrir el formulario. | Escribir el código del aula a mano, en la misma pantalla. |
| **Cámara** (sacar foto) | `expo-image-picker` · `launchCameraAsync()` sobre el mismo permiso | Al tocar “Abrir la cámara” en `/reporte/foto`. | Elegir una foto con el selector del sistema, o cargar el reporte sin foto. |
| **Galería** | `expo-image-picker` · `launchImageLibraryAsync()` | **Nunca.** El selector del sistema corre fuera de la app y devuelve sólo la imagen elegida. | — (no hay nada que denegar) |
| **Ubicación (primer plano)** | `expo-location` · `useForegroundPermissions()` | Al tocar “Marcar dónde estoy” en `/reporte/ubicacion`. | Elegir el sector a mano (patio, estacionamiento, pasillo…). |
| **Notificaciones** | `expo-notifications` · `requestPermissionsAsync()` | Sólo al activar el interruptor “Avisarme cuando se resuelva mi reporte” en `/ajustes-app`. | Los mismos avisos quedan en la bandeja `/avisos`. |

### Los `blockedPermissions`, uno por uno

| Permiso bloqueado | Quién lo agregaba | Por qué lo sacamos |
| --- | --- | --- |
| `RECORD_AUDIO` | `expo-camera` y `expo-image-picker` lo declaran porque sus módulos **pueden** grabar video con audio. | La app lee QR y saca fotos fijas. Nunca graba sonido. Dejarlo mostraría “Micrófono” en la ficha de Play. |
| `SYSTEM_ALERT_WINDOW` | Ninguna librería de este proyecto; está por pedido explícito de la consigna. | Es un permiso **especial** (dibujar sobre otras apps). La app no tiene nada que superponer. Lo bloqueamos para que ninguna dependencia futura lo cuele. |
| `ACCESS_BACKGROUND_LOCATION` | `expo-location` si se activara `isAndroidBackgroundLocationEnabled`. | La ubicación se lee una vez, con la app abierta. Pedir segundo plano obligaría además a una revisión manual de Google Play. |
| `READ_MEDIA_IMAGES` · `READ_MEDIA_VIDEO` · `READ_MEDIA_VISUAL_USER_SELECTED` | Nadie los declara hoy, pero son los permisos de galería de Android 13/14. | La app usa el *photo picker*. Bloquearlos deja por escrito que **no** queremos acceso a la fototeca, aunque mañana se agregue una librería que lo pida. |

**Lo que sí dejamos**, y por qué: `READ_EXTERNAL_STORAGE` y `WRITE_EXTERNAL_STORAGE` con
`android:maxSdkVersion="32"`, que vienen del manifiesto de `expo-image-picker`. Están acotados
a Android 12 y anteriores, donde el selector de fotos moderno no existe y el módulo los
necesita para devolver la imagen elegida. En Android 13+ Android directamente no los instala.
Bloquearlos rompería la función en los teléfonos viejos a cambio de nada.

---

## Auditoría del manifiesto (desafío opcional)

Salida real de `npx expo prebuild --clean` → `android/app/src/main/AndroidManifest.xml`:

| Permiso en el manifiesto generado | Quién lo agrega | ¿Lo sacamos? |
| --- | --- | --- |
| `INTERNET` | Expo / React Native (base) | No. Es de instalación y lo necesita el bundler en desarrollo. |
| `CAMERA` | `expo-camera` y `expo-image-picker` | No: es el permiso central de la app. |
| `ACCESS_COARSE_LOCATION` | `expo-location` | No. Es la mitad aproximada del permiso de ubicación. |
| `ACCESS_FINE_LOCATION` | `expo-location` | No. Las dos van juntas en un solo diálogo. |
| `VIBRATE` | `expo-notifications` | No. Es de instalación, sin diálogo, y es lo que hace que el aviso se sienta. |
| `READ_EXTERNAL_STORAGE` *(maxSdkVersion 32)* | `expo-image-picker` | No, ver arriba. |
| `WRITE_EXTERNAL_STORAGE` *(maxSdkVersion 32)* | `expo-image-picker` | No, ver arriba. |
| `RECORD_AUDIO` | `expo-camera` / `expo-image-picker` | **Sí** — `tools:node="remove"`. |
| `SYSTEM_ALERT_WINDOW` | — (preventivo) | **Sí** — `tools:node="remove"`. |
| `ACCESS_BACKGROUND_LOCATION` | — (preventivo) | **Sí** — `tools:node="remove"`. |
| `READ_MEDIA_IMAGES` · `READ_MEDIA_VIDEO` · `READ_MEDIA_VISUAL_USER_SELECTED` | — (preventivo) | **Sí** — `tools:node="remove"`. |

**Dato que vale la pena anotar:** `POST_NOTIFICATIONS` y `RECEIVE_BOOT_COMPLETED` **no
aparecen** en ese archivo y sin embargo están en el APK. Los declara `expo-notifications` en el
manifiesto de la **librería**, y el *manifest merger* de Gradle los fusiona recién al compilar.
O sea: el manifiesto generado por `prebuild` no es la lista completa de permisos de la app. Para
ver la lista final hay que mirar el APK (`aapt dump permissions app.apk`) o el manifiesto
fusionado que deja Gradle en `android/app/build/intermediates/merged_manifests/`.

El `Info.plist` generado, en cambio, queda con **exactamente dos** claves de propósito:

```xml
<key>NSCameraUsageDescription</key>
<string>Usamos la cámara para leer el QR pegado en la puerta del aula y para sacar la foto del desperfecto que estás reportando.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Usamos tu ubicación para marcar en qué sector del Instituto está el desperfecto que estás reportando.</string>
```

Sin micrófono, sin fototeca y sin ubicación “siempre”.

---

## Cómo está resuelto cada requisito

### 1 · Hook unificado — [`src/hooks/usePermiso.ts`](./src/hooks/usePermiso.ts)

```ts
const { estado, parcial, pedir, abrirAjustes, consultar, respuesta, ficha } = usePermiso('camara');
// estado: 'cargando' | 'concedido' | 'preguntable' | 'bloqueado'
```

Los cuatro estados salen de **dos campos** de la respuesta de Expo:

```ts
if (!respuesta) return 'cargando';          // primer render: todavía no sabemos nada
if (respuesta.granted) return 'concedido';
return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
```

Por dentro usa los hooks oficiales de cada módulo (`useCameraPermissions`,
`Location.useForegroundPermissions`) y, para notificaciones —que no tiene hook propio—,
`getPermissionsAsync()` con estado local. Cada instancia consulta **sólo su recurso**, gracias
a `{ get: recurso === 'camara' }`.

Se refresca solo en dos momentos:
- **`useFocusEffect`** → al volver de la pantalla previa o de otra pantalla.
- **`useRevisarAlVolver`** (`AppState`) → al volver de **Ajustes**.

`parcial` devuelve el matiz cuando el permiso está concedido a medias: `'Ubicación aproximada'`
(`android.accuracy === 'coarse'` / `ios.accuracy === 'reduced'`) o
`'Avisos provisionales (sin diálogo)'` (`ios.status === PROVISIONAL`).

### 2 · Escáner con cuatro estados — [`src/app/reporte/escanear.tsx`](./src/app/reporte/escanear.tsx)

Cargando → indicador · concedido → `CameraView` · preguntable / bloqueado → tarjeta que lleva a
la previa. **En los cuatro**, el campo “escribir el código a mano” está disponible.

### 3 · Foto sin permiso de galería — [`src/app/reporte/foto.tsx`](./src/app/reporte/foto.tsx)

“Elegir de la galería” llama a `ImagePicker.launchImageLibraryAsync()` y no consulta ningún
permiso. La app no declara `READ_MEDIA_IMAGES` ni `NSPhotoLibraryUsageDescription`.

### 4 · Ubicación respetuosa — [`src/app/reporte/ubicacion.tsx`](./src/app/reporte/ubicacion.tsx)

Sólo primer plano. Si el permiso es aproximado, la app guarda y muestra **“Ubicación
aproximada”** en lugar de coordenadas: con ~3 km² de margen, el número daría una precisión que
no existe. Si se deniega, el reporte se carga con el sector elegido a mano.

### 5 · Notificaciones en contexto — [`src/app/ajustes-app.tsx`](./src/app/ajustes-app.tsx)

El permiso se pide **únicamente** al activar el interruptor. En Android,
`prepararCanalAndroid()` crea el canal `"reportes"` **antes** de pedir. “Simular resolución”
(en `/reporte/[id]`) programa una notificación local a los 10 segundos si el permiso está
concedido; si no, el aviso aparece igual en `/avisos`.

### 6 · Pantallas previas — [`src/components/pantalla-previa.tsx`](./src/components/pantalla-previa.tsx)

`/permisos/[recurso]` es el **único** lugar de la app que llama a `pedir()`. Un solo botón
“Continuar”, sin “Ahora no” ni “Cerrar”. Si el permiso está bloqueado, el texto pasa a explicar
el camino exacto en Ajustes (distinto por plataforma, desde `RECURSOS[recurso].comoActivar`) y
el botón pasa a ser **“Abrir Ajustes”**.

### 7 · La app nunca se bloquea

| Función | Alternativa sin permiso |
| --- | --- |
| Escanear el QR | Escribir el código del aula a mano |
| Sacar una foto | Elegir una del selector del sistema, o ninguna |
| Marcar la ubicación | Elegir el sector a mano |
| Recibir el aviso | La bandeja `/avisos` |

Crear un reporte no requiere ningún permiso.

### 8 · No insistir

La previa **nunca se abre sola**. La única excepción es `/reporte/escanear`, cuya razón de ser
*es* la cámara: ahí se ofrece una vez, con un `useRef` que impide repetirla. Si la persona dice
que no y vuelve a entrar, ve la tarjeta y el campo manual, pero el modal no reaparece hasta que
toque “Continuar”.

### 9 · Panel de permisos — [`src/app/(tabs)/permisos.tsx`](./src/app/(tabs)/permisos.tsx)

Cada recurso con su estado, su matiz y los campos crudos que lo explican (`status`,
`canAskAgain`, `android.accuracy`, `ios.scope`, `ios.status`), más `Platform.OS` en el
encabezado. Incluye una fila **“Fotos · No se pide”** que deja explícito por qué la galería no
aparece como permiso.

### Desafíos opcionales

- ✅ **Auditoría del manifiesto** — la tabla de arriba.
- ✅ **Notificaciones provisionales** — en `/ajustes-app`, sólo en iOS:
  `requestPermissionsAsync({ ios: { allowProvisional: true } })`. El panel de permisos muestra
  “Avisos provisionales (sin diálogo)” cuando `ios.status === PROVISIONAL`. `puedeAvisar()`
  contempla que con autorización provisional `granted` puede venir en `false`.
- ✅ **Bloqueo por plataforma** — `RECURSOS[recurso].comoActivar` tiene la ruta exacta de
  Ajustes para Android y para iOS; la previa muestra la que corresponde con `Platform.OS`.
- ⬜ **Nota de voz con `expo-audio`** — no implementada: habría obligado a declarar
  `RECORD_AUDIO` y `NSMicrophoneUsageDescription`, que es justo lo que la app evita. Agregarla
  significaría sacar `RECORD_AUDIO` de `blockedPermissions`, poner
  `microphonePermission: <texto>` en los plugins y **recompilar**: no sale con una OTA.

---

## Capturas

> **Pendiente de completar por el alumno.** Las imágenes van en `docs/capturas/` con estos
> nombres; los enlaces de abajo ya apuntan ahí.

| # | Qué mostrar | Archivo |
| --- | --- | --- |
| 1 | Escáner · estado **cargando** | `docs/capturas/escaner-1-cargando.png` |
| 2 | Escáner · estado **concedido** (la cámara) | `docs/capturas/escaner-2-concedido.png` |
| 3 | Escáner · estado **preguntable** + la previa | `docs/capturas/escaner-3-preguntable.png` |
| 4 | Escáner · estado **bloqueado** con “Abrir Ajustes” | `docs/capturas/escaner-4-bloqueado.png` |
| 5 | Ubicación **concedida** (y el chip de aproximada, si toca) | `docs/capturas/ubicacion-concedida.png` |
| 6 | Ubicación **denegada** + sector a mano | `docs/capturas/ubicacion-denegada.png` |
| 7 | Foto elegida desde el **selector del sistema** | `docs/capturas/foto-selector.png` |
| 8 | **Notificación recibida** (los 10 segundos) | `docs/capturas/notificacion.png` |
| 9 | Panel de permisos **antes** de ir a Ajustes | `docs/capturas/panel-antes.png` |
| 10 | Panel de permisos **después** de volver de Ajustes | `docs/capturas/panel-despues.png` |
| 11 | **El diálogo del sistema en una development build**, con el texto de propósito propio | `docs/capturas/dialogo-texto-propio.png` |

La número 11 es la que **no** se puede sacar en Expo Go: ahí el diálogo muestra el texto de
Expo Go. Hay que correr `npx expo run:android` (o una build de EAS) y sacarla desde ahí.

Para reproducir los estados sin reinstalar:

```bash
adb shell pm reset-permissions                        # todo vuelve a "sin decidir"
adb shell pm revoke ar.edu.ipf.mantenimiento android.permission.CAMERA
xcrun simctl privacy booted reset all ar.edu.ipf.mantenimiento
```

---

## Preguntas de la defensa oral

**1 · ¿Qué código decide entre “Continuar” y “Abrir Ajustes”? ¿Qué campo lo decide?**

Lo decide **`canAskAgain`**, en `estadoDesdeRespuesta()`
([`src/lib/permisos.ts`](./src/lib/permisos.ts)):

```ts
if (!respuesta) return 'cargando';
if (respuesta.granted) return 'concedido';
return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
```

Y en [`pantalla-previa.tsx`](./src/components/pantalla-previa.tsx), `'bloqueado'` renderiza el
botón “Abrir Ajustes” (`Linking.openSettings()`) y `'preguntable'` el botón “Continuar”
(`pedir()`). La lógica es: `granted` responde *“¿puedo usarlo?”*; `canAskAgain` responde *“¿tiene
sentido mostrar el diálogo?”* — y de ahí sale la etiqueta del botón.

**2 · Revoco la cámara desde Ajustes con la app abierta y vuelvo. ¿Qué hace Android? ¿Cómo se
entera mi código?**

Android **mata el proceso de la app** para que nada siga corriendo con un permiso que ya no
tiene; al volver, la app se reinicia desde cero. (En iOS el proceso no se mata, pero el estado
cambió igual.)

El código se entera por `AppState`: `useRevisarAlVolver` escucha la transición
`background → active` y llama a `consultar()`, que es el `get…PermissionsAsync()`, no el
`request…()`. Sin eso, el panel seguiría mostrando el estado viejo. Es el bug del paso 6 de D4.

**3 · ¿Por qué la app no pide permiso para elegir una foto, pero sí para sacarla?**

Porque son dos cosas distintas. El **selector del sistema** corre **fuera** de la caja de arena
de la app: la persona elige una imagen y el sistema le pasa a la app sólo ésa. La app nunca ve
la fototeca, así que no hay nada que autorizar.

**Sacar una foto** es usar el hardware de la cámara desde adentro de la app: ahí sí se accede a
un recurso sensible en vivo, y el sistema exige permiso. Es el principio de **mínimo
privilegio**: si existe un selector del sistema que resuelve la necesidad, ése es siempre el
mejor camino, porque el mejor permiso es el que no hace falta pedir.

**4 · ¿Qué cambia si la persona elige ubicación aproximada? ¿Y si la deniega?**

**Aproximada:** el permiso está concedido (`granted: true`), pero `android.accuracy` vale
`'coarse'` (o `ios.accuracy` vale `'reduced'`). La app lo detecta con `esAproximada()`, pide la
posición con menor precisión (`Accuracy.Low`), y **no muestra coordenadas**: guarda y muestra el
texto “Ubicación aproximada”, con un chip de aviso. Mostrar `−26.18542, −58.17458` con 3 km² de
margen sería mentir con números.

**Denegada:** `obtenerUbicacion()` devuelve `null` sin lanzar ninguna excepción, la pantalla
muestra la tarjeta de permiso con su alternativa y el reporte se carga con el **sector elegido a
mano**. La diferencia práctica para mantenimiento es “Patio” en vez de un punto en el mapa — que
para encontrar una luz quemada alcanza perfectamente.

**5 · ¿Por qué mis textos de propósito no aparecían en Expo Go?**

Porque en Expo Go la app que corre **es Expo Go**, no la mía: mi proyecto es JavaScript que Expo
Go interpreta. El `Info.plist` y el `AndroidManifest.xml` que usa el sistema son los del binario
de Expo Go, compilados por Expo meses antes, con textos genéricos para todos los módulos que
trae. Mi `app.json` no puede modificar el `Info.plist` de otra app. Por eso el diálogo dice “Expo
Go quiere acceder a la cámara”, y por eso `blockedPermissions` tampoco hace nada ahí. Los textos
propios aparecen recién en una development build o en una build de producción.

**6 · Si mañana agrego la nota de voz, ¿alcanza con una OTA?**

**No.** La nota de voz necesita `RECORD_AUDIO` en el `AndroidManifest.xml` y
`NSMicrophoneUsageDescription` en el `Info.plist` — y hoy la app los bloquea a propósito
(`recordAudioAndroid: false`, `microphonePermission: false`, `RECORD_AUDIO` en
`blockedPermissions`).

Una actualización OTA reemplaza el **bundle de JavaScript**, no el binario. El manifiesto, el
`Info.plist` y el módulo nativo de `expo-audio` viajan **dentro** del binario. Si publicara sólo
el JS: en Android la solicitud devolvería denegado al instante sin mostrar diálogo (el permiso no
está en el manifiesto) y en iOS la app **crashearía** al tocar el micrófono. Hay que cambiar
`app.json`, correr `prebuild`, compilar una build nueva y publicarla en las tiendas.

---

## Decisiones de diseño que vale la pena justificar

**Los datos viven en memoria.** `src/lib/store.tsx` es un Context, sin base de datos ni
`AsyncStorage`: al cerrar la app los reportes vuelven al estado inicial. Es deliberado — el
objeto de este TP son los permisos, y agregar persistencia habría sumado una dependencia y
ruido sin enseñar nada sobre el tema. Hay dos reportes de ejemplo precargados para que la lista
no arranque vacía.

**`usePermiso` monta los hooks de los tres módulos, pero consulta uno solo.** Las reglas de los
hooks obligan a llamarlos siempre, en el mismo orden; lo que sí se puede es desactivar la
consulta automática (`{ get: recurso === 'camara', request: false }`). Así una pantalla que usa
la cámara no dispara ninguna lectura de ubicación.

**La intención se guarda, el permiso se consulta.** En `/ajustes-app`, el interruptor combina
dos cosas distintas: `quiereAvisos` (dato de la app, que sí se guarda) y `permiso.estado` (dato
del sistema, que se consulta cada vez). El interruptor queda encendido sólo si las dos cosas son
verdaderas. Cachear el permiso “para siempre” es el error que produce “sigue diciendo bloqueado
después de activarlo en Ajustes”.
