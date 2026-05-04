import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Loader2, Edit2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Movement {
  id: string;
  fecha: string;
  movimiento: string;
  proyecto: string;
  bodega: string;
  tipo: string;
  pieza: string;
  modelo: string;
  cantidad: number;
}

const BODEGAS = ['Bigbox', 'Blindados', 'Energisol', 'Oficina', 'Patio'];
const MOVIMIENTOS = ['Entrada', 'Salida'];

const CATEGORY_MAP: Record<string, Record<string, string[]>> = {
  'Calentador': {
    'Tanque': ['EN HEAT PIPE 20/1800', 'EN HP 150 15/1800', 'EN HP 200 20/1800'],
    'Espejos': ['Heat Pipe'],
    'Estructura': ['EN HEAT PIPE 20/1800', 'EN HP 15/1800', 'EN HP 20/1800'],
    'Tubos': ['58/1800 EN HP', '58/1800 HEAT PIPE', '47/1500', '58/1800']
  },
  'Luminarias': {
    'Luminaria': ['X4DN25'],
    'poste': ['SENCILLO - 6 MTS', 'DOBLE - 6 MTS', 'SENCILLO - 8 MTS']
  }
};

export default function Inventory() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [movimiento, setMovimiento] = useState(MOVIMIENTOS[0]);
  const [bodega, setBodega] = useState(BODEGAS[0]);
  const [proyecto, setProyecto] = useState('');
  const [tipo, setTipo] = useState('');
  const [pieza, setPieza] = useState('');
  const [modelo, setModelo] = useState('');
  const [cantidad, setCantidad] = useState(1);

  // Derived Dropdown Options
  const tipos = Object.keys(CATEGORY_MAP);
  const piezas = tipo ? Object.keys(CATEGORY_MAP[tipo] || {}) : [];
  const modelos = pieza && tipo ? CATEGORY_MAP[tipo][pieza] || [] : [];

  useEffect(() => {
    fetchMovements();

    const channel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_movements' }, () => {
        fetchMovements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMovements() {
    const { data } = await supabase.from('inventory_movements').select('*').order('fecha', { ascending: false }).order('created_at', { ascending: false });
    if (data) setMovements(data as Movement[]);
  }

  // Handle cascading clears when NOT editing
  useEffect(() => {
    if (!editingId) {
      setPieza('');
      setModelo('');
    }
  }, [tipo, editingId]);

  useEffect(() => {
    if (!editingId) {
      setModelo('');
    }
  }, [pieza, editingId]);

  function handleEditClick(record: Movement) {
    setEditingId(record.id);
    setFecha(record.fecha);
    setMovimiento(record.movimiento);
    setBodega(record.bodega);
    setProyecto(record.proyecto || '');
    setTipo(record.tipo);
    setPieza(record.pieza);
    setModelo(record.modelo);
    setCantidad(record.cantidad);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setFecha(new Date().toISOString().split('T')[0]);
    setMovimiento(MOVIMIENTOS[0]);
    setBodega(BODEGAS[0]);
    setProyecto('');
    setTipo('');
    setPieza('');
    setModelo('');
    setCantidad(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fecha || !tipo || !pieza || !modelo || !cantidad) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user authenticated");

      const payload = {
        fecha,
        movimiento,
        bodega,
        proyecto: proyecto || null,
        tipo,
        pieza,
        modelo,
        cantidad,
        autorizador: user.id
      };

      if (editingId) {
        const { error } = await supabase.from('inventory_movements').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Record updated successfully');
        cancelEdit();
      } else {
        const { error } = await supabase.from('inventory_movements').insert([payload]);
        if (error) throw error;
        toast.success('Record created successfully');
        cancelEdit(); // Clears form
      }
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error saving record');
    } finally {
      setLoading(false);
    }
  }

  const filteredMovements = movements.filter(m => 
    m.modelo.toLowerCase().includes(search.toLowerCase()) || 
    m.proyecto?.toLowerCase().includes(search.toLowerCase()) ||
    m.bodega.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* Left Column: Reporting Table */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Inventory Reporting</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Movement</th>
                  <th className="p-4">Warehouse</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Model</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((record) => (
                  <tr key={record.id} className={`hover:bg-slate-50 transition-colors ${editingId === record.id ? 'bg-sky-50' : ''}`}>
                    <td className="p-4 text-sm text-slate-600">{record.fecha}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${record.movimiento === 'Entrada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {record.movimiento}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-700 font-medium">{record.bodega}</td>
                    <td className="p-4 text-sm text-slate-500">{record.proyecto || '-'}</td>
                    <td className="p-4 text-sm text-slate-900">
                      <div className="font-medium">{record.modelo}</div>
                      <div className="text-xs text-slate-500">{record.tipo} - {record.pieza}</div>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-700">{record.cantidad}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEditClick(record)}
                        className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Form Side Panel */}
      <div className="w-full lg:w-80 shrink-0">
        <div className={`border rounded-2xl p-6 shadow-sm sticky top-6 transition-colors ${editingId ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-bold ${editingId ? 'text-sky-900' : 'text-slate-900'}`}>
              {editingId ? 'Edit Record' : 'New Record'}
            </h3>
            {editingId && (
              <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Date</label>
              <input 
                type="date" value={fecha} onChange={e => setFecha(e.target.value)} required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Movement</label>
                <select 
                  value={movimiento} onChange={e => setMovimiento(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {MOVIMIENTOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Warehouse</label>
                <select 
                  value={bodega} onChange={e => setBodega(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {BODEGAS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Project</label>
              <input 
                type="text" value={proyecto} onChange={e => setProyecto(e.target.value)}
                placeholder="Optional"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <hr className={`${editingId ? 'border-sky-200' : 'border-slate-100'}`} />

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Type</label>
              <select 
                value={tipo} onChange={e => setTipo(e.target.value)} required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Select Type</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Part</label>
              <select 
                value={pieza} onChange={e => setPieza(e.target.value)} required disabled={!tipo}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">Select Part</option>
                {piezas.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Model</label>
              <select 
                value={modelo} onChange={e => setModelo(e.target.value)} required disabled={!pieza}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">Select Model</option>
                {modelos.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Quantity</label>
              <input 
                type="number" min="1" value={cantidad} onChange={e => setCantidad(parseInt(e.target.value))} required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !modelo}
              className={`w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 mt-6 ${editingId ? 'bg-sky-600 hover:bg-sky-700' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : editingId ? (
                <Save className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {editingId ? 'Save Changes' : 'Save Record'}
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
}
