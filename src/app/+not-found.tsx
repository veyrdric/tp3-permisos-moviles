import { router, Stack } from 'expo-router';

import { Boton, Nota, Pantalla, Tarjeta, Titulo } from '@/components/ui';

export default function NoEncontrada() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrada' }} />
      <Pantalla>
        <Tarjeta>
          <Titulo>Esa pantalla no existe</Titulo>
          <Nota>Puede que el enlace esté mal escrito o que el reporte ya no esté.</Nota>
          <Boton titulo="Ir a mis reportes" onPress={() => router.replace('/')} />
        </Tarjeta>
      </Pantalla>
    </>
  );
}
