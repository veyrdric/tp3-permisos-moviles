import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { fecha } from '@/components/estado-reporte';
import { Boton, Chip, Nota, Pantalla, Parrafo, Tarjeta, Titulo } from '@/components/ui';
import { useStore } from '@/lib/store';

/**
 * La alternativa a las notificaciones del sistema: pase lo que pase con el
 * permiso, todos los avisos quedan acá adentro.
 */
export default function Avisos() {
  const { avisos } = useStore();

  return (
    <Pantalla
      titulo="Avisos"
      bajada="Todo lo que la app te avisó, aunque las notificaciones estén apagadas.">
      <Boton
        titulo="Ajustes de avisos"
        variante="secundario"
        onPress={() => router.push('/ajustes-app')}
      />
      {avisos.length === 0 ? (
        <Tarjeta>
          <Titulo>No hay avisos todavía</Titulo>
          <Nota>
            Cuando un reporte tuyo se resuelva, el aviso aparece acá. Podés probarlo con “Simular
            resolución” en el detalle de un reporte.
          </Nota>
          <Boton
            titulo="Ver mis reportes"
            variante="secundario"
            onPress={() => router.push('/')}
          />
        </Tarjeta>
      ) : null}

      {avisos.map((aviso) => (
        <Pressable
          key={aviso.id}
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/reporte/[id]', params: { id: aviso.reporteId } })
          }>
          <Tarjeta>
            <Titulo>{aviso.titulo}</Titulo>
            <Parrafo>{aviso.cuerpo}</Parrafo>
            <Nota>{fecha(aviso.fecha)}</Nota>
            {aviso.soloEnApp ? (
              <Chip texto="Sólo en la app (notificaciones apagadas)" tono="aviso" />
            ) : (
              <Chip texto="También te llegó como notificación" tono="exito" />
            )}
          </Tarjeta>
        </Pressable>
      ))}
    </Pantalla>
  );
}
