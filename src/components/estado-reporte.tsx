import { Chip, type Tono } from '@/components/ui';
import type { EstadoReporte } from '@/lib/store';

const TONO: Record<EstadoReporte, Tono> = {
  pendiente: 'aviso',
  'en curso': 'primario',
  resuelto: 'exito',
};

const ETIQUETA: Record<EstadoReporte, string> = {
  pendiente: 'Pendiente',
  'en curso': 'En curso',
  resuelto: 'Resuelto',
};

export function ChipEstadoReporte({ estado }: { estado: EstadoReporte }) {
  return <Chip texto={ETIQUETA[estado]} tono={TONO[estado]} />;
}

export function fecha(ms: number): string {
  return new Date(ms).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
