import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { Colores } from '@/lib/tema';

function Icono({ simbolo, color }: { simbolo: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{simbolo}</Text>;
}

export default function LayoutTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colores.primario,
        tabBarInactiveTintColor: Colores.textoSuave,
        headerStyle: { backgroundColor: Colores.tarjeta },
        headerTitleStyle: { color: Colores.texto },
        sceneStyle: { backgroundColor: Colores.fondo },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color }) => <Icono simbolo="🛠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="avisos"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color }) => <Icono simbolo="🔔" color={color} />,
        }}
      />
      <Tabs.Screen
        name="permisos"
        options={{
          title: 'Permisos',
          tabBarIcon: ({ color }) => <Icono simbolo="🔐" color={color} />,
        }}
      />
    </Tabs>
  );
}
