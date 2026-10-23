import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { AvisoPermiso } from '@/components/aviso-permiso';
import { Boton, Cargando, Nota, Pantalla, Parrafo, Tarjeta, Titulo } from '@/components/ui';
import { usePermiso } from '@/hooks/usePermiso';
import { useStore } from '@/lib/store';
import { Radio } from '@/lib/tema';

/**
 * /reporte/foto · dos caminos, un solo permiso.
 *
 * "Sacar foto" usa la cámara, así que pasa por el permiso de cámara.
 * "Elegir de la galería" abre el selector del sistema: ese selector corre
 * fuera de la app y devuelve una sola imagen, por eso no hace falta ningún
 * permiso de galería y la app no lo declara.
 */
export default function Foto() {
  const permiso = usePermiso('camara');
  const { borrador, actualizarBorrador } = useStore();
  const [trabajando, setTrabajando] = useState(false);

  const sacarFoto = async () => {
    setTrabajando(true);
    try {
      const resultado = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (!resultado.canceled) actualizarBorrador({ fotoUri: resultado.assets[0].uri });
    } finally {
      setTrabajando(false);
    }
  };

  const elegirDeGaleria = async () => {
    setTrabajando(true);
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
      });
      if (!resultado.canceled) actualizarBorrador({ fotoUri: resultado.assets[0].uri });
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <Pantalla bajada="Una foto ayuda a que mantenimiento sepa qué llevar.">
      {borrador.fotoUri ? (
        <Tarjeta>
          <Titulo>Foto adjunta</Titulo>
          <Image
            source={{ uri: borrador.fotoUri }}
            style={{ width: '100%', height: 220, borderRadius: Radio.md }}
            resizeMode="cover"
          />
          <Boton
            titulo="Quitar la foto"
            variante="secundario"
            onPress={() => actualizarBorrador({ fotoUri: null })}
          />
        </Tarjeta>
      ) : null}

      {trabajando ? <Cargando texto="Abriendo…" /> : null}

      <Tarjeta>
        <Titulo>Elegir de la galería</Titulo>
        <Parrafo>
          Abre el selector del sistema. La app recibe únicamente la imagen que elegís: no mira el
          resto de tus fotos.
        </Parrafo>
        <Nota>Sin permiso: no hay diálogo porque no hay nada que autorizar.</Nota>
        <Boton
          titulo="Abrir el selector"
          onPress={() => {
            void elegirDeGaleria();
          }}
        />
      </Tarjeta>

      <Tarjeta>
        <Titulo>Sacar una foto ahora</Titulo>
        <Parrafo>Para esto sí hace falta la cámara.</Parrafo>
        {permiso.estado === 'cargando' ? <Cargando texto="Revisando el permiso…" /> : null}
        {permiso.estado === 'concedido' ? (
          <Boton
            titulo="Abrir la cámara"
            onPress={() => {
              void sacarFoto();
            }}
          />
        ) : null}
      </Tarjeta>

      {permiso.estado === 'preguntable' || permiso.estado === 'bloqueado' ? (
        <AvisoPermiso
          permiso={permiso}
          motivo="La cámara sirve para sacar la foto del desperfecto en el momento."
        />
      ) : null}

      <View>
        <Boton titulo="Volver al reporte" variante="secundario" onPress={() => router.back()} />
      </View>
    </Pantalla>
  );
}
