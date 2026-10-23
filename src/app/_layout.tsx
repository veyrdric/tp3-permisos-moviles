import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { configurarPresentacion } from '@/lib/notificaciones';
import { ProveedorStore } from '@/lib/store';
import { Colores } from '@/lib/tema';

// Que los avisos también se vean con la app abierta.
configurarPresentacion();

export default function LayoutRaiz() {
  return (
    <ProveedorStore>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colores.tarjeta },
          headerTintColor: Colores.primario,
          headerTitleStyle: { color: Colores.texto },
          contentStyle: { backgroundColor: Colores.fondo },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reporte/nuevo" options={{ title: 'Nuevo reporte' }} />
        <Stack.Screen name="reporte/escanear" options={{ title: 'Escanear QR del aula' }} />
        <Stack.Screen name="reporte/foto" options={{ title: 'Adjuntar foto' }} />
        <Stack.Screen name="reporte/ubicacion" options={{ title: 'Marcar ubicación' }} />
        <Stack.Screen name="reporte/[id]" options={{ title: 'Detalle del reporte' }} />
        <Stack.Screen name="ajustes-app" options={{ title: 'Ajustes de la app' }} />
        <Stack.Screen
          name="permisos/[recurso]"
          options={{ presentation: 'modal', title: 'Antes de continuar' }}
        />
      </Stack>
    </ProveedorStore>
  );
}
