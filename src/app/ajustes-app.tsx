import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Switch, View } from 'react-native';

import { Boton, Cargando, Chip, Nota, Pantalla, Parrafo, Tarjeta, Titulo } from '@/components/ui';
import { usePermiso } from '@/hooks/usePermiso';
import { pedirPermisoNotificaciones } from '@/lib/notificaciones';
import { Colores, Espacio } from '@/lib/tema';

/**
 * /ajustes-app · el único lugar donde se piden las notificaciones.
 *
 * El permiso no se pide al abrir la app ni al crear el reporte: se pide cuando
 * la persona activa el interruptor, que es el momento en que el aviso tiene
 * sentido para ella.
 */
export default function AjustesApp() {
  const permiso = usePermiso('notificaciones');
  const [quiereAvisos, setQuiereAvisos] = useState(false);
  const [pidiendoProvisional, setPidiendoProvisional] = useState(false);

  const concedido = permiso.estado === 'concedido';
  const activado = quiereAvisos && concedido;

  const cambiar = (valor: boolean) => {
    if (!valor) {
      setQuiereAvisos(false);
      return;
    }
    setQuiereAvisos(true);
    if (concedido) return;
    // Pantalla previa primero; el diálogo del sistema sale de ahí.
    router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'notificaciones' } });
  };

  const pedirProvisional = async () => {
    setPidiendoProvisional(true);
    try {
      await pedirPermisoNotificaciones({ provisional: true });
      await permiso.consultar();
      setQuiereAvisos(true);
    } finally {
      setPidiendoProvisional(false);
    }
  };

  return (
    <Pantalla bajada="Qué querés que la app haga por su cuenta.">
      <Tarjeta>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: Espacio.md,
          }}>
          <View style={{ flex: 1, gap: Espacio.xs }}>
            <Titulo>Avisarme cuando se resuelva mi reporte</Titulo>
            <Nota>Un aviso por reporte, cuando mantenimiento lo marca como resuelto.</Nota>
          </View>
          <Switch
            value={activado}
            onValueChange={cambiar}
            trackColor={{ true: Colores.primario, false: Colores.borde }}
          />
        </View>

        {permiso.estado === 'cargando' ? <Cargando texto="Revisando el permiso…" /> : null}
        {permiso.parcial ? <Chip texto={permiso.parcial} tono="aviso" /> : null}

        {quiereAvisos && permiso.estado === 'preguntable' ? (
          <Nota>
            Todavía no autorizaste las notificaciones. Tocá otra vez el interruptor para volver a
            ver la explicación.
          </Nota>
        ) : null}

        {quiereAvisos && permiso.estado === 'bloqueado' ? (
          <>
            <Nota>
              Las notificaciones están bloqueadas, así que el sistema ya no va a preguntar. Se
              activan desde Ajustes.
            </Nota>
            <Boton
              titulo="Abrir Ajustes"
              onPress={() =>
                router.push({
                  pathname: '/permisos/[recurso]',
                  params: { recurso: 'notificaciones' },
                })
              }
            />
          </>
        ) : null}
      </Tarjeta>

      <Tarjeta>
        <Titulo>Pase lo que pase, no te perdés nada</Titulo>
        <Parrafo>
          Los avisos se guardan siempre en la bandeja de la app. Las notificaciones del sistema son
          un extra para enterarte sin abrirla.
        </Parrafo>
        <Boton titulo="Ver mis avisos" variante="secundario" onPress={() => router.push('/avisos')} />
      </Tarjeta>

      {Platform.OS === 'ios' && permiso.estado === 'preguntable' ? (
        <Tarjeta>
          <Titulo>Avisos silenciosos</Titulo>
          <Parrafo>
            iOS permite recibir avisos sin diálogo: llegan directo al centro de notificaciones, sin
            sonido ni banner, y ahí mismo podés decidir si los querés destacados.
          </Parrafo>
          <Nota>
            Se pide con allowProvisional: true. Como no interrumpe a nadie, no necesita pantalla
            previa.
          </Nota>
          {pidiendoProvisional ? (
            <Cargando texto="Pidiendo…" />
          ) : (
            <Boton
              titulo="Activar avisos silenciosos"
              variante="secundario"
              onPress={() => {
                void pedirProvisional();
              }}
            />
          )}
        </Tarjeta>
      ) : null}
    </Pantalla>
  );
}
