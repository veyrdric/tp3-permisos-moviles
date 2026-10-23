import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ChipEstadoReporte, fecha } from '@/components/estado-reporte';
import { Boton, Nota, Pantalla, Parrafo, Tarjeta, Titulo } from '@/components/ui';
import { useStore } from '@/lib/store';
import { Espacio } from '@/lib/tema';

export default function Inicio() {
  const { reportes } = useStore();

  return (
    <Pantalla titulo="Mis reportes" bajada="Lo que informaste sobre el edificio del Instituto.">
      <Boton titulo="Nuevo reporte" onPress={() => router.push('/reporte/nuevo')} />

      {reportes.length === 0 ? (
        <Tarjeta>
          <Titulo>Todavía no reportaste nada</Titulo>
          <Nota>Cuando veas una luz quemada o una canilla que pierde, cargala acá.</Nota>
        </Tarjeta>
      ) : null}

      {reportes.map((reporte) => (
        <Pressable
          key={reporte.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: reporte.id } })}>
          <Tarjeta>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Espacio.sm }}>
              <Titulo>{reporte.titulo}</Titulo>
              <ChipEstadoReporte estado={reporte.estado} />
            </View>
            <Parrafo>{reporte.descripcion}</Parrafo>
            <Nota>
              Aula {reporte.aula} · {reporte.sector ?? 'sin sector'} · {fecha(reporte.creado)}
            </Nota>
          </Tarjeta>
        </Pressable>
      ))}
    </Pantalla>
  );
}
