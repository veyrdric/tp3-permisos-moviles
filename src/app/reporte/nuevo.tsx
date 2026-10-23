import { router } from 'expo-router';
import { View } from 'react-native';

import { Boton, Campo, Chip, Nota, Opciones, Pantalla, Tarjeta, Titulo } from '@/components/ui';
import { CATEGORIAS, useStore, type Categoria } from '@/lib/store';
import { Espacio } from '@/lib/tema';

/**
 * /reporte/nuevo · el formulario.
 *
 * Al abrirse no pide ningún permiso: cada función (escanear, foto, ubicación)
 * vive en su propia pantalla y pide lo suyo recién cuando la persona la toca.
 */
export default function NuevoReporte() {
  const { borrador, actualizarBorrador, limpiarBorrador, crearReporte } = useStore();
  const completo = borrador.titulo.trim().length > 2 && borrador.descripcion.trim().length > 2;

  const guardar = () => {
    const reporte = crearReporte();
    router.replace({ pathname: '/reporte/[id]', params: { id: reporte.id } });
  };

  return (
    <Pantalla bajada="Contanos qué viste. Las tres funciones de abajo son opcionales.">
      <Campo
        etiqueta="Título"
        valor={borrador.titulo}
        onChangeText={(titulo) => actualizarBorrador({ titulo })}
        placeholder="Proyector que no enciende"
      />
      <Campo
        etiqueta="Descripción"
        valor={borrador.descripcion}
        onChangeText={(descripcion) => actualizarBorrador({ descripcion })}
        placeholder="Qué pasa, desde cuándo, a qué hora se nota"
        multiline
      />
      <Campo
        etiqueta="Aula"
        valor={borrador.aula}
        onChangeText={(aula) => actualizarBorrador({ aula })}
        placeholder="A-12"
        autoCapitalize="characters"
      />
      <Opciones<Categoria>
        etiqueta="Categoría"
        opciones={CATEGORIAS}
        valor={borrador.categoria}
        onChange={(categoria) => actualizarBorrador({ categoria })}
      />

      <Tarjeta>
        <Titulo>Completar con el teléfono</Titulo>
        <Nota>Cada botón pide su permiso recién cuando lo tocás, y ninguno es obligatorio.</Nota>

        <Boton
          titulo="Escanear el QR del aula"
          variante="secundario"
          onPress={() => router.push('/reporte/escanear')}
        />
        <Boton
          titulo="Adjuntar una foto"
          variante="secundario"
          onPress={() => router.push('/reporte/foto')}
        />
        <Boton
          titulo="Marcar la ubicación"
          variante="secundario"
          onPress={() => router.push('/reporte/ubicacion')}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.sm, marginTop: Espacio.xs }}>
          {borrador.aula ? <Chip texto={`Aula ${borrador.aula}`} tono="primario" /> : null}
          {borrador.fotoUri ? <Chip texto="Foto adjunta" tono="exito" /> : null}
          {borrador.ubicacion ? (
            <Chip
              texto={borrador.ubicacion.aproximada ? 'Ubicación aproximada' : 'Ubicación exacta'}
              tono={borrador.ubicacion.aproximada ? 'aviso' : 'exito'}
            />
          ) : null}
          {borrador.sector ? <Chip texto={`Sector: ${borrador.sector}`} tono="primario" /> : null}
        </View>
      </Tarjeta>

      <Boton titulo="Guardar reporte" onPress={guardar} disabled={!completo} />
      <Boton
        titulo="Descartar borrador"
        variante="secundario"
        onPress={() => {
          limpiarBorrador();
          router.back();
        }}
      />
      {completo ? null : <Nota>Escribí al menos un título y una descripción para guardar.</Nota>}
    </Pantalla>
  );
}
