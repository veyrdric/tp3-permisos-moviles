import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { Boton, Chip, Nota, Pantalla, Parrafo, Tarjeta, Titulo, type Tono } from '@/components/ui';
import { usePermiso } from '@/hooks/usePermiso';
import { ETIQUETA_ESTADO, RECURSOS, type EstadoPermiso, type Recurso } from '@/lib/permisos';
import { Espacio } from '@/lib/tema';

const TONO_ESTADO: Record<EstadoPermiso, Tono> = {
  cargando: 'neutro',
  concedido: 'exito',
  preguntable: 'primario',
  bloqueado: 'peligro',
};

/**
 * Panel de permisos. No pide nada por sí mismo: el botón lleva siempre a la
 * pantalla previa. Se actualiza solo al volver de Ajustes (AppState) y al
 * volver a tener foco, gracias a usePermiso.
 */
export default function PanelPermisos() {
  return (
    <Pantalla
      titulo="Permisos"
      bajada={`Estado real de cada permiso en esta plataforma (${Platform.OS}).`}>
      <FilaPermiso recurso="camara" />
      <FilaPermiso recurso="ubicacion" />
      <FilaPermiso recurso="notificaciones" />
      <FilaFotos />
      <Nota>
        Cambiá un permiso desde Ajustes y volvé a la app: esta pantalla se actualiza sola, sin
        reiniciar nada.
      </Nota>
    </Pantalla>
  );
}

function FilaPermiso({ recurso }: { recurso: Recurso }) {
  const permiso = usePermiso(recurso);
  const { estado, ficha, parcial, respuesta } = permiso;

  return (
    <Tarjeta>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Espacio.sm }}>
        <Titulo>{ficha.titulo}</Titulo>
        <Chip texto={ETIQUETA_ESTADO[estado]} tono={TONO_ESTADO[estado]} />
      </View>
      <Parrafo>{ficha.beneficio}</Parrafo>
      {parcial ? <Chip texto={parcial} tono="aviso" /> : null}
      <Nota>{detalleCrudo(permiso.recurso, respuesta)}</Nota>

      {estado === 'preguntable' ? (
        <Boton
          titulo="Pedir permiso"
          onPress={() => router.push({ pathname: '/permisos/[recurso]', params: { recurso } })}
        />
      ) : null}
      {estado === 'bloqueado' ? (
        <Boton
          titulo="Abrir Ajustes"
          onPress={() => router.push({ pathname: '/permisos/[recurso]', params: { recurso } })}
        />
      ) : null}
      {estado === 'concedido' ? <Nota>Alternativa si lo revocás: {ficha.alternativa}</Nota> : null}
    </Tarjeta>
  );
}

/**
 * La galería no aparece como permiso porque la app nunca lo pide: para elegir
 * una foto usa el selector del sistema, que devuelve una sola imagen y no
 * necesita acceso a toda la biblioteca.
 */
function FilaFotos() {
  return (
    <Tarjeta>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Espacio.sm }}>
        <Titulo>Fotos</Titulo>
        <Chip texto="No se pide" tono="neutro" />
      </View>
      <Parrafo>
        Para adjuntar una foto guardada abrimos el selector del sistema. La app recibe sólo la
        imagen que elegís, así que no hay permiso de galería que conceder ni revocar.
      </Parrafo>
      <Nota>
        En Android eso significa que el manifiesto no declara READ_MEDIA_IMAGES ni
        READ_MEDIA_VIDEO; en iOS, que el Info.plist no lleva NSPhotoLibraryUsageDescription.
      </Nota>
    </Tarjeta>
  );
}

/** Los campos de plataforma que explican el matiz, tal como los devuelve Expo. */
function detalleCrudo(recurso: Recurso, respuesta: ReturnType<typeof usePermiso>['respuesta']) {
  if (!respuesta) return 'Sin respuesta todavía.';

  const base = `status: ${respuesta.status} · canAskAgain: ${respuesta.canAskAgain}`;

  if (recurso === 'ubicacion' && 'android' in respuesta && respuesta.android) {
    const android = respuesta.android as { accuracy?: string };
    return `${base} · android.accuracy: ${android.accuracy}`;
  }
  if (recurso === 'ubicacion' && 'ios' in respuesta && respuesta.ios && 'scope' in respuesta.ios) {
    return `${base} · ios.scope: ${respuesta.ios.scope} · ios.accuracy: ${respuesta.ios.accuracy}`;
  }
  if (recurso === 'notificaciones' && 'ios' in respuesta && respuesta.ios && 'status' in respuesta.ios) {
    return `${base} · ios.status: ${respuesta.ios.status}`;
  }
  return base;
}
