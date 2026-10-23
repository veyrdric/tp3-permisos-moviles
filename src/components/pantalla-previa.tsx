import { Platform, View } from 'react-native';

import { Boton, Cargando, Nota, Parrafo, Tarjeta, Titulo } from '@/components/ui';
import { usePermiso } from '@/hooks/usePermiso';
import { Espacio } from '@/lib/tema';
import type { Recurso } from '@/lib/permisos';

/**
 * La pantalla previa al diálogo del sistema.
 *
 * Tiene los tres elementos de una buena previa: qué recurso pedimos, para qué
 * lo usamos (una frase, con beneficio concreto) y un único botón de avance.
 * No hay "Ahora no" ni "Cerrar": la persona siempre puede cerrar el modal con
 * el gesto del sistema, y eso no cuenta como un rechazo.
 *
 * Si el permiso ya está bloqueado, el botón deja de tener sentido (el diálogo
 * no va a aparecer) y pasa a ser "Abrir Ajustes", con el camino exacto de cada
 * plataforma escrito arriba.
 */
export function PantallaPrevia({ recurso, alTerminar }: { recurso: Recurso; alTerminar: () => void }) {
  const permiso = usePermiso(recurso);
  const { ficha, estado } = permiso;

  if (estado === 'cargando') {
    return (
      <View style={{ padding: Espacio.md }}>
        <Cargando texto={`Revisando el permiso de ${ficha.titulo.toLowerCase()}…`} />
      </View>
    );
  }

  // El módulo nativo no está en este entorno. No es un permiso denegado:
  // no hay nada que pedir ni nada que activar en Ajustes.
  if (!permiso.disponible) {
    return (
      <View style={{ padding: Espacio.md, gap: Espacio.md }}>
        <Tarjeta>
          <Titulo>Acá no se puede activar {ficha.titulo.toLowerCase()}</Titulo>
          <Parrafo>
            Este entorno no trae el módulo nativo que hace falta. Pasa en Expo Go para Android,
            que desde el SDK 53 ya no lo incluye.
          </Parrafo>
          <Nota>Para probarlo, compilá una development build con npx expo run:android.</Nota>
          <Nota>Mientras tanto: {ficha.alternativa}</Nota>
        </Tarjeta>
        <Boton titulo="Listo" onPress={alTerminar} />
      </View>
    );
  }

  if (estado === 'concedido') {
    return (
      <View style={{ padding: Espacio.md, gap: Espacio.md }}>
        <Tarjeta>
          <Titulo>{ficha.titulo} ya está activado</Titulo>
          <Parrafo>{ficha.beneficio}</Parrafo>
          {permiso.parcial ? <Nota>Con un matiz: {permiso.parcial.toLowerCase()}.</Nota> : null}
        </Tarjeta>
        <Boton titulo="Listo" onPress={alTerminar} />
      </View>
    );
  }

  if (estado === 'bloqueado') {
    return (
      <View style={{ padding: Espacio.md, gap: Espacio.md }}>
        <Tarjeta>
          <Titulo>{ficha.titulo} está bloqueada para esta app</Titulo>
          <Parrafo>{ficha.beneficio}</Parrafo>
          <Nota>
            El sistema ya no va a volver a preguntar, así que hay que activarlo a mano:
            {'\n'}
            {Platform.OS === 'ios' ? ficha.comoActivar.ios : ficha.comoActivar.android}
          </Nota>
          <Nota>Mientras tanto: {ficha.alternativa}</Nota>
        </Tarjeta>
        <Boton
          titulo="Abrir Ajustes"
          onPress={() => {
            void permiso.abrirAjustes();
          }}
        />
      </View>
    );
  }

  // 'preguntable': sin decidir, o denegado pero el sistema deja volver a pedir.
  return (
    <View style={{ padding: Espacio.md, gap: Espacio.md }}>
      <Tarjeta>
        <Titulo>Permiso de {ficha.titulo.toLowerCase()}</Titulo>
        <Parrafo>{ficha.beneficio}</Parrafo>
        <Nota>Lo podés cambiar cuando quieras desde Ajustes.</Nota>
        <Nota>Si preferís que no: {ficha.alternativa}</Nota>
      </Tarjeta>
      <Boton
        titulo="Continuar"
        onPress={() => {
          void permiso.pedir().then(alTerminar);
        }}
      />
    </View>
  );
}
