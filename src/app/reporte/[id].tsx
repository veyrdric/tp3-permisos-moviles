import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { ChipEstadoReporte, fecha } from '@/components/estado-reporte';
import { Boton, Chip, Nota, Pantalla, Parrafo, Tarjeta, Titulo } from '@/components/ui';
import { usePermiso } from '@/hooks/usePermiso';
import { programarAvisoResolucion } from '@/lib/notificaciones';
import { CATEGORIAS, useStore } from '@/lib/store';
import { Espacio, Radio } from '@/lib/tema';

export default function DetalleReporte() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { obtenerReporte, resolverReporte } = useStore();
  const permisoAvisos = usePermiso('notificaciones');
  const [ultimoAviso, setUltimoAviso] = useState<'notificacion' | 'bandeja' | null>(null);

  const reporte = typeof id === 'string' ? obtenerReporte(id) : undefined;

  if (!reporte) {
    return (
      <Pantalla>
        <Tarjeta>
          <Titulo>No encontramos ese reporte</Titulo>
          <Nota>
            El identificador “{String(id)}” no corresponde a ningún reporte tuyo. Puede que el
            enlace esté mal o que el reporte se haya borrado.
          </Nota>
          <Boton titulo="Ver mis reportes" onPress={() => router.replace('/')} />
        </Tarjeta>
      </Pantalla>
    );
  }

  const categoria = CATEGORIAS.find((item) => item.valor === reporte.categoria)?.etiqueta ?? '—';

  const simularResolucion = async () => {
    const puedeNotificar = permisoAvisos.estado === 'concedido';
    const aviso = resolverReporte(reporte.id, !puedeNotificar);
    if (!aviso) return;

    if (puedeNotificar) {
      await programarAvisoResolucion(aviso.titulo, aviso.cuerpo);
      setUltimoAviso('notificacion');
    } else {
      setUltimoAviso('bandeja');
    }
  };

  return (
    <Pantalla>
      <Tarjeta>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Espacio.sm }}>
          <Titulo>{reporte.titulo}</Titulo>
          <ChipEstadoReporte estado={reporte.estado} />
        </View>
        <Parrafo>{reporte.descripcion}</Parrafo>
        <Nota>
          {categoria} · Aula {reporte.aula} · {fecha(reporte.creado)}
        </Nota>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.sm }}>
          {reporte.sector ? <Chip texto={`Sector: ${reporte.sector}`} tono="primario" /> : null}
          {reporte.ubicacion ? (
            <Chip
              texto={reporte.ubicacion.texto}
              tono={reporte.ubicacion.aproximada ? 'aviso' : 'exito'}
            />
          ) : null}
        </View>
      </Tarjeta>

      {reporte.fotoUri ? (
        <Tarjeta>
          <Titulo>Foto</Titulo>
          <Image
            source={{ uri: reporte.fotoUri }}
            style={{ width: '100%', height: 220, borderRadius: Radio.md }}
            resizeMode="cover"
          />
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <Titulo>Probar el aviso de resolución</Titulo>
        <Nota>
          Marca el reporte como resuelto y dispara el aviso. Si las notificaciones están
          concedidas, llega una notificación local a los 10 segundos; si no, el aviso queda en la
          bandeja de la app.
        </Nota>
        <Boton
          titulo="Simular resolución"
          onPress={() => {
            void simularResolucion();
          }}
          disabled={reporte.estado === 'resuelto'}
        />
        {reporte.estado === 'resuelto' ? <Nota>Este reporte ya figura como resuelto.</Nota> : null}

        {ultimoAviso === 'notificacion' ? (
          <Chip texto="Notificación programada para dentro de 10 s" tono="exito" />
        ) : null}
        {ultimoAviso === 'bandeja' ? (
          <Chip texto="El aviso quedó en “Avisos” dentro de la app" tono="aviso" />
        ) : null}

        {permisoAvisos.estado !== 'concedido' ? (
          <Boton
            titulo="Activar los avisos"
            variante="secundario"
            onPress={() => router.push('/ajustes-app')}
          />
        ) : null}
      </Tarjeta>

      <Boton titulo="Ver mis avisos" variante="secundario" onPress={() => router.push('/avisos')} />
    </Pantalla>
  );
}
