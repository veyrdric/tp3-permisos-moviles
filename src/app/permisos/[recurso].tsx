import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { PantallaPrevia } from '@/components/pantalla-previa';
import { Boton, Nota, Tarjeta, Titulo } from '@/components/ui';
import { esRecurso } from '@/lib/permisos';
import { Colores, Espacio } from '@/lib/tema';

/**
 * /permisos/[recurso] · la pantalla previa, como modal.
 *
 * Es el único lugar de la app que llama a `pedir()`. Nunca se abre sola:
 * siempre llega desde una función que la persona tocó.
 */
export default function Previa() {
  const { recurso } = useLocalSearchParams<{ recurso: string }>();

  const cerrar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/permisos');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colores.fondo }}
      contentContainerStyle={{ paddingVertical: Espacio.md }}>
      {esRecurso(recurso) ? (
        <PantallaPrevia recurso={recurso} alTerminar={cerrar} />
      ) : (
        <Tarjeta style={{ margin: Espacio.md }}>
          <Titulo>Ese permiso no existe</Titulo>
          <Nota>“{String(recurso)}” no es un recurso que esta app pida.</Nota>
          <Boton titulo="Volver" onPress={cerrar} />
        </Tarjeta>
      )}
    </ScrollView>
  );
}
