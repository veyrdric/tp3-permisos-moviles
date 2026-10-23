import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colores, Espacio, Radio } from '@/lib/tema';

export type Tono = 'neutro' | 'primario' | 'exito' | 'aviso' | 'peligro';

const FONDO_TONO: Record<Tono, string> = {
  neutro: Colores.neutroSuave,
  primario: Colores.primarioSuave,
  exito: Colores.exitoSuave,
  aviso: Colores.avisoSuave,
  peligro: Colores.peligroSuave,
};

const TEXTO_TONO: Record<Tono, string> = {
  neutro: Colores.textoSuave,
  primario: Colores.primario,
  exito: Colores.exito,
  aviso: Colores.aviso,
  peligro: Colores.peligro,
};

export function Pantalla({
  titulo,
  bajada,
  children,
}: {
  titulo?: string;
  bajada?: string;
  children: ReactNode;
}) {
  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled">
      {titulo ? <Text style={estilos.titulo}>{titulo}</Text> : null}
      {bajada ? <Text style={estilos.bajada}>{bajada}</Text> : null}
      {children}
    </ScrollView>
  );
}

export function Tarjeta({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[estilos.tarjeta, style]}>{children}</View>;
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={estilos.tituloTarjeta}>{children}</Text>;
}

export function Parrafo({ children }: { children: ReactNode }) {
  return <Text style={estilos.parrafo}>{children}</Text>;
}

export function Nota({ children }: { children: ReactNode }) {
  return <Text style={estilos.nota}>{children}</Text>;
}

export function Chip({ texto, tono = 'neutro' }: { texto: string; tono?: Tono }) {
  return (
    <View style={[estilos.chip, { backgroundColor: FONDO_TONO[tono] }]}>
      <Text style={[estilos.chipTexto, { color: TEXTO_TONO[tono] }]}>{texto}</Text>
    </View>
  );
}

export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  disabled = false,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  disabled?: boolean;
}) {
  const esPrimario = variante === 'primario';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        esPrimario ? estilos.botonPrimario : estilos.botonSecundario,
        pressed && estilos.botonApretado,
        disabled && estilos.botonInactivo,
      ]}>
      <Text style={esPrimario ? estilos.botonTextoPrimario : estilos.botonTextoSecundario}>
        {titulo}
      </Text>
    </Pressable>
  );
}

export function Cargando({ texto }: { texto: string }) {
  return (
    <View style={estilos.cargando}>
      <ActivityIndicator color={Colores.primario} />
      <Text style={estilos.nota}>{texto}</Text>
    </View>
  );
}

export function Campo({
  etiqueta,
  valor,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize = 'sentences',
}: {
  etiqueta: string;
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colores.textoSuave}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[estilos.input, multiline && estilos.inputLargo]}
      />
    </View>
  );
}

export function Opciones<T extends string>({
  etiqueta,
  opciones,
  valor,
  onChange,
}: {
  etiqueta?: string;
  opciones: { valor: T; etiqueta: string }[];
  valor: T | null;
  onChange: (valor: T) => void;
}) {
  return (
    <View style={estilos.campo}>
      {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}
      <View style={estilos.opciones}>
        {opciones.map((opcion) => {
          const activa = opcion.valor === valor;
          return (
            <Pressable
              key={opcion.valor}
              accessibilityRole="radio"
              accessibilityState={{ selected: activa }}
              onPress={() => onChange(opcion.valor)}
              style={[estilos.opcion, activa && estilos.opcionActiva]}>
              <Text style={[estilos.opcionTexto, activa && estilos.opcionTextoActivo]}>
                {opcion.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  contenido: { padding: Espacio.md, gap: Espacio.md, paddingBottom: Espacio.xl },
  titulo: { fontSize: 24, fontWeight: '700', color: Colores.texto },
  bajada: { fontSize: 15, color: Colores.textoSuave, marginTop: -Espacio.sm },
  tarjeta: {
    backgroundColor: Colores.tarjeta,
    borderRadius: Radio.lg,
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: Espacio.md,
    gap: Espacio.sm,
  },
  tituloTarjeta: { fontSize: 17, fontWeight: '700', color: Colores.texto },
  parrafo: { fontSize: 15, lineHeight: 21, color: Colores.texto },
  nota: { fontSize: 13, lineHeight: 18, color: Colores.textoSuave },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Espacio.sm + 2,
    paddingVertical: Espacio.xs,
  },
  chipTexto: { fontSize: 12, fontWeight: '700' },
  boton: {
    borderRadius: Radio.md,
    paddingVertical: 14,
    paddingHorizontal: Espacio.md,
    alignItems: 'center',
  },
  botonPrimario: { backgroundColor: Colores.primario },
  botonSecundario: { backgroundColor: Colores.tarjeta, borderWidth: 1, borderColor: Colores.borde },
  botonApretado: { opacity: 0.75 },
  botonInactivo: { opacity: 0.45 },
  botonTextoPrimario: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  botonTextoSecundario: { color: Colores.primario, fontSize: 16, fontWeight: '700' },
  cargando: { gap: Espacio.sm, alignItems: 'center', paddingVertical: Espacio.lg },
  campo: { gap: Espacio.xs },
  etiqueta: { fontSize: 13, fontWeight: '700', color: Colores.textoSuave },
  input: {
    backgroundColor: Colores.tarjeta,
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: Radio.md,
    paddingHorizontal: Espacio.md,
    paddingVertical: 12,
    fontSize: 16,
    color: Colores.texto,
  },
  inputLargo: { minHeight: 96, textAlignVertical: 'top' },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.sm },
  opcion: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.tarjeta,
    paddingHorizontal: Espacio.md,
    paddingVertical: Espacio.sm,
  },
  opcionActiva: { backgroundColor: Colores.primario, borderColor: Colores.primario },
  opcionTexto: { fontSize: 14, fontWeight: '600', color: Colores.textoSuave },
  opcionTextoActivo: { color: '#FFFFFF' },
});
