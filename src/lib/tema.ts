/**
 * Paleta y medidas compartidas. Un solo lugar para que todas las pantallas
 * se vean iguales sin arrastrar una librería de estilos.
 */
export const Colores = {
  fondo: '#F4F6FB',
  tarjeta: '#FFFFFF',
  borde: '#DFE4EE',
  texto: '#111827',
  textoSuave: '#5B6578',
  primario: '#1D4ED8',
  primarioSuave: '#E6EDFE',
  exito: '#15803D',
  exitoSuave: '#DCFCE7',
  aviso: '#B45309',
  avisoSuave: '#FEF3C7',
  peligro: '#B91C1C',
  peligroSuave: '#FEE2E2',
  neutroSuave: '#EEF1F6',
} as const;

export const Espacio = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radio = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;
