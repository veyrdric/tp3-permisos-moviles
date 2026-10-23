import { router } from 'expo-router';

import { Boton, Nota, Parrafo, Tarjeta, Titulo } from '@/components/ui';
import type { UsoPermiso } from '@/hooks/usePermiso';

/**
 * Tarjeta que una pantalla muestra cuando su permiso no está concedido.
 *
 * No pide nada por sí misma: el botón abre la pantalla previa
 * (/permisos/[recurso]), que es el único lugar de la app desde donde se llama
 * a `pedir()`. Así la previa aparece siempre que la persona toca la función, y
 * nunca sola.
 */
export function AvisoPermiso({ permiso, motivo }: { permiso: UsoPermiso; motivo: string }) {
  const bloqueado = permiso.estado === 'bloqueado';
  const abrirPrevia = () =>
    router.push({ pathname: '/permisos/[recurso]', params: { recurso: permiso.recurso } });

  return (
    <Tarjeta>
      <Titulo>
        {bloqueado
          ? `${permiso.ficha.titulo} bloqueada`
          : `Necesitamos el permiso de ${permiso.ficha.titulo.toLowerCase()}`}
      </Titulo>
      <Parrafo>{motivo}</Parrafo>
      <Nota>{permiso.ficha.alternativa}</Nota>
      <Boton titulo={bloqueado ? 'Abrir Ajustes' : 'Continuar'} onPress={abrirPrevia} />
    </Tarjeta>
  );
}
