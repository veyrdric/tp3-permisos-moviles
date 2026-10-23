import { router } from 'expo-router';
import { useState } from 'react';

import { AvisoPermiso } from '@/components/aviso-permiso';
import { Boton, Cargando, Chip, Nota, Opciones, Pantalla, Parrafo, Tarjeta, Titulo } from '@/components/ui';
import { usePermiso } from '@/hooks/usePermiso';
import { SECTORES, useStore } from '@/lib/store';
import { describirUbicacion, obtenerUbicacion } from '@/lib/ubicacion';

const OPCIONES_SECTOR = SECTORES.map((sector) => ({ valor: sector, etiqueta: sector }));

/**
 * /reporte/ubicacion · sólo primer plano.
 *
 * La app nunca pide ubicación en segundo plano: para marcar dónde está un
 * desperfecto alcanza con leerla una vez, mientras la persona mira la pantalla.
 *
 * Si el permiso concedido es aproximado, no mostramos coordenadas: con ~3 km²
 * de margen, el número daría una precisión que no existe.
 */
export default function Ubicacion() {
  const permiso = usePermiso('ubicacion');
  const { borrador, actualizarBorrador } = useStore();
  const [buscando, setBuscando] = useState(false);
  const [sinSenal, setSinSenal] = useState(false);

  const marcar = async () => {
    setBuscando(true);
    setSinSenal(false);
    const ubicacion = await obtenerUbicacion();
    setBuscando(false);

    if (!ubicacion) {
      setSinSenal(true);
      return;
    }
    actualizarBorrador({
      ubicacion: { texto: describirUbicacion(ubicacion), aproximada: ubicacion.aproximada },
    });
  };

  return (
    <Pantalla bajada="Para que mantenimiento sepa a qué parte del edificio ir.">
      {borrador.ubicacion ? (
        <Tarjeta>
          <Titulo>Ubicación marcada</Titulo>
          <Parrafo>{borrador.ubicacion.texto}</Parrafo>
          {borrador.ubicacion.aproximada ? (
            <Nota>
              El sistema entregó precisión reducida, así que guardamos “aproximada” en lugar de un
              punto exacto. Elegí también el sector para que no quede ambiguo.
            </Nota>
          ) : null}
          <Boton
            titulo="Quitar la ubicación"
            variante="secundario"
            onPress={() => actualizarBorrador({ ubicacion: null })}
          />
        </Tarjeta>
      ) : null}

      {permiso.estado === 'cargando' ? <Cargando texto="Revisando el permiso de ubicación…" /> : null}

      {permiso.estado === 'concedido' ? (
        <Tarjeta>
          <Titulo>Usar mi ubicación actual</Titulo>
          <Parrafo>La leemos una sola vez, ahora, con la app abierta.</Parrafo>
          {permiso.parcial ? <Chip texto={permiso.parcial} tono="aviso" /> : null}
          {buscando ? (
            <Cargando texto="Buscando señal…" />
          ) : (
            <Boton
              titulo="Marcar dónde estoy"
              onPress={() => {
                void marcar();
              }}
            />
          )}
          {sinSenal ? (
            <Nota>No pudimos resolver la posición. Elegí el sector a mano y seguí.</Nota>
          ) : null}
        </Tarjeta>
      ) : null}

      {permiso.estado === 'preguntable' || permiso.estado === 'bloqueado' ? (
        <AvisoPermiso
          permiso={permiso}
          motivo="Con tu ubicación marcamos el sector del Instituto donde está el desperfecto."
        />
      ) : null}

      <Tarjeta>
        <Titulo>Elegir el sector a mano</Titulo>
        <Nota>Alcanza para cargar el reporte: la ubicación nunca es obligatoria.</Nota>
        <Opciones
          opciones={OPCIONES_SECTOR}
          valor={borrador.sector}
          onChange={(sector) => actualizarBorrador({ sector })}
        />
      </Tarjeta>

      <Boton titulo="Volver al reporte" variante="secundario" onPress={() => router.back()} />
    </Pantalla>
  );
}
