import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { AvisoPermiso } from '@/components/aviso-permiso';
import { Boton, Campo, Cargando, Nota, Pantalla, Tarjeta, Titulo } from '@/components/ui';
import { usePermiso } from '@/hooks/usePermiso';
import { useStore } from '@/lib/store';
import { Radio } from '@/lib/tema';

/**
 * /reporte/escanear · los cuatro estados del permiso de cámara.
 *
 *   cargando    → indicador, no decidimos nada todavía
 *   concedido   → la cámara
 *   preguntable → tarjeta que lleva a la pantalla previa
 *   bloqueado   → tarjeta que lleva a Ajustes
 *
 * En los tres estados que no son "concedido" la pantalla sigue siendo útil:
 * el código del aula se puede escribir a mano.
 */
export default function Escanear() {
  const permiso = usePermiso('camara');
  const { actualizarBorrador } = useStore();
  const [codigoManual, setCodigoManual] = useState('');
  const yaLeido = useRef(false);
  const yaOfrecido = useRef(false);

  // La persona tocó "Escanear el QR del aula": ofrecer la previa una sola vez.
  // Si vuelve después de haber dicho que no, la tarjeta queda a la vista pero
  // la previa no se abre sola otra vez.
  useEffect(() => {
    if (permiso.estado === 'preguntable' && !yaOfrecido.current) {
      yaOfrecido.current = true;
      router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'camara' } });
    }
  }, [permiso.estado]);

  const usarCodigo = (codigo: string) => {
    const limpio = codigo.trim().toUpperCase();
    if (!limpio) return;
    actualizarBorrador({ aula: limpio });
    router.back();
  };

  return (
    <Pantalla bajada="El QR está pegado en la puerta de cada aula.">
      {permiso.estado === 'cargando' ? <Cargando texto="Revisando el permiso de cámara…" /> : null}

      {permiso.estado === 'concedido' ? (
        <View style={{ height: 320, borderRadius: Radio.lg, overflow: 'hidden' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (yaLeido.current) return; // el lector dispara muchas veces por segundo
              yaLeido.current = true;
              usarCodigo(data);
            }}
          />
        </View>
      ) : null}

      {permiso.estado === 'preguntable' || permiso.estado === 'bloqueado' ? (
        <AvisoPermiso
          permiso={permiso}
          motivo="Con la cámara leemos el QR de la puerta y completamos el campo “Aula” solo."
        />
      ) : null}

      <Tarjeta>
        <Titulo>Escribir el código a mano</Titulo>
        <Nota>Funciona siempre, con o sin cámara. Está impreso debajo del QR.</Nota>
        <Campo
          etiqueta="Código del aula"
          valor={codigoManual}
          onChangeText={setCodigoManual}
          placeholder="A-12"
          autoCapitalize="characters"
        />
        <Boton
          titulo="Usar este código"
          variante="secundario"
          onPress={() => usarCodigo(codigoManual)}
          disabled={codigoManual.trim().length === 0}
        />
      </Tarjeta>
    </Pantalla>
  );
}
