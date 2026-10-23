import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Categoria = 'electricidad' | 'agua' | 'mobiliario' | 'equipos';
export type EstadoReporte = 'pendiente' | 'en curso' | 'resuelto';

export const CATEGORIAS: { valor: Categoria; etiqueta: string }[] = [
  { valor: 'electricidad', etiqueta: 'Electricidad' },
  { valor: 'agua', etiqueta: 'Agua' },
  { valor: 'mobiliario', etiqueta: 'Mobiliario' },
  { valor: 'equipos', etiqueta: 'Equipos' },
];

export const SECTORES = ['Aula', 'Patio', 'Estacionamiento', 'Pasillo', 'Baños', 'Biblioteca'];

export type UbicacionReporte = {
  /** Ya viene listo para mostrar: coordenadas, o "Ubicación aproximada". */
  texto: string;
  aproximada: boolean;
};

export type Reporte = {
  id: string;
  titulo: string;
  descripcion: string;
  aula: string;
  categoria: Categoria;
  estado: EstadoReporte;
  fotoUri: string | null;
  ubicacion: UbicacionReporte | null;
  sector: string | null;
  creado: number;
};

export type Aviso = {
  id: string;
  reporteId: string;
  titulo: string;
  cuerpo: string;
  fecha: number;
  /** true cuando el aviso sólo quedó acá porque el permiso no estaba concedido. */
  soloEnApp: boolean;
};

/** Lo que se va completando en /reporte/nuevo y sus pantallas satélite. */
export type Borrador = {
  titulo: string;
  descripcion: string;
  aula: string;
  categoria: Categoria;
  fotoUri: string | null;
  ubicacion: UbicacionReporte | null;
  sector: string | null;
};

export const BORRADOR_VACIO: Borrador = {
  titulo: '',
  descripcion: '',
  aula: '',
  categoria: 'electricidad',
  fotoUri: null,
  ubicacion: null,
  sector: null,
};

const REPORTES_INICIALES: Reporte[] = [
  {
    id: 'r-1001',
    titulo: 'Tubo fluorescente quemado',
    descripcion: 'El tubo del fondo parpadea y después se apaga.',
    aula: 'A-12',
    categoria: 'electricidad',
    estado: 'en curso',
    fotoUri: null,
    ubicacion: null,
    sector: 'Aula',
    creado: Date.now() - 1000 * 60 * 60 * 26,
  },
  {
    id: 'r-1002',
    titulo: 'Canilla que pierde',
    descripcion: 'La canilla del lavatorio gotea todo el día.',
    aula: '—',
    categoria: 'agua',
    estado: 'pendiente',
    fotoUri: null,
    ubicacion: null,
    sector: 'Baños',
    creado: Date.now() - 1000 * 60 * 90,
  },
];

type ValorStore = {
  reportes: Reporte[];
  avisos: Aviso[];
  borrador: Borrador;
  actualizarBorrador: (parcial: Partial<Borrador>) => void;
  limpiarBorrador: () => void;
  crearReporte: () => Reporte;
  obtenerReporte: (id: string) => Reporte | undefined;
  resolverReporte: (id: string, soloEnApp: boolean) => Aviso | null;
};

const StoreContext = createContext<ValorStore | null>(null);

let contador = 1002;
const siguienteId = (prefijo: string) => `${prefijo}-${++contador}`;

export function ProveedorStore({ children }: { children: ReactNode }) {
  const [reportes, setReportes] = useState<Reporte[]>(REPORTES_INICIALES);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [borrador, setBorrador] = useState<Borrador>(BORRADOR_VACIO);

  const actualizarBorrador = useCallback((parcial: Partial<Borrador>) => {
    setBorrador((previo) => ({ ...previo, ...parcial }));
  }, []);

  const limpiarBorrador = useCallback(() => setBorrador(BORRADOR_VACIO), []);

  const crearReporte = useCallback(() => {
    const nuevo: Reporte = {
      ...borrador,
      titulo: borrador.titulo.trim(),
      descripcion: borrador.descripcion.trim(),
      aula: borrador.aula.trim() || '—',
      id: siguienteId('r'),
      estado: 'pendiente',
      creado: Date.now(),
    };
    setReportes((previos) => [nuevo, ...previos]);
    setBorrador(BORRADOR_VACIO);
    return nuevo;
  }, [borrador]);

  const obtenerReporte = useCallback(
    (id: string) => reportes.find((reporte) => reporte.id === id),
    [reportes]
  );

  const resolverReporte = useCallback(
    (id: string, soloEnApp: boolean) => {
      const reporte = reportes.find((item) => item.id === id);
      if (!reporte || reporte.estado === 'resuelto') return null;

      setReportes((previos) =>
        previos.map((item) => (item.id === id ? { ...item, estado: 'resuelto' } : item))
      );

      const aviso: Aviso = {
        id: siguienteId('a'),
        reporteId: id,
        titulo: 'Tu reporte se resolvió',
        cuerpo: `“${reporte.titulo}” (${reporte.aula}) figura como resuelto.`,
        fecha: Date.now(),
        soloEnApp,
      };
      setAvisos((previos) => [aviso, ...previos]);
      return aviso;
    },
    [reportes]
  );

  const valor = useMemo<ValorStore>(
    () => ({
      reportes,
      avisos,
      borrador,
      actualizarBorrador,
      limpiarBorrador,
      crearReporte,
      obtenerReporte,
      resolverReporte,
    }),
    [
      reportes,
      avisos,
      borrador,
      actualizarBorrador,
      limpiarBorrador,
      crearReporte,
      obtenerReporte,
      resolverReporte,
    ]
  );

  return <StoreContext.Provider value={valor}>{children}</StoreContext.Provider>;
}

export function useStore(): ValorStore {
  const valor = useContext(StoreContext);
  if (!valor) throw new Error('useStore() tiene que usarse dentro de <ProveedorStore>');
  return valor;
}
