import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, FileText, Settings2 } from 'lucide-react';

interface Movement {
  id: string;
  movimiento: string;
  proyecto: string;
  bodega: string;
  tipo: string;
  pieza: string;
  modelo: string;
  cantidad: number;
}

const BODEGAS = ['All', 'Bigbox', 'Blindados', 'Energisol', 'Oficina', 'Patio'];
const GROUPABLE_FIELDS = [
  { key: 'bodega', label: 'Warehouse' },
  { key: 'proyecto', label: 'Project' },
  { key: 'tipo', label: 'Type' },
  { key: 'pieza', label: 'Part' },
  { key: 'modelo', label: 'Model' },
  { key: 'movimiento', label: 'Movement' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMovements: 0,
    activeLeads: 0,
    monthlySales: 0,
  });

  const [inventoryData, setInventoryData] = useState<Movement[]>([]);
  const [selectedBodega, setSelectedBodega] = useState('All');
  const [groupBy, setGroupBy] = useState<string[]>(['proyecto', 'tipo']);

  useEffect(() => {
    async function fetchData() {
      // Fetch Stats
      const { count: activeLeads } = await supabase
        .from('sales_funnel')
        .select('*', { count: 'exact', head: true })
        .neq('stage', 'Closed');

      const { data: closedDeals } = await supabase
        .from('sales_funnel')
        .select('value')
        .eq('stage', 'Closed');
      const monthlySales = closedDeals?.reduce((acc, deal) => acc + Number(deal.value), 0) || 0;

      // Fetch Inventory Data for Pivot Table
      const { data: movements } = await supabase
        .from('inventory_movements')
        .select('*');

      if (movements) {
        setInventoryData(movements as Movement[]);
        setStats({
          totalMovements: movements.length,
          activeLeads: activeLeads || 0,
          monthlySales,
        });
      }
    }

    fetchData();
  }, []);

  const toggleGroupBy = (key: string) => {
    setGroupBy(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  const aggregatedData = useMemo(() => {
    // 1. Filter
    const filtered = inventoryData.filter(d => selectedBodega === 'All' || d.bodega === selectedBodega);
    
    // 2. Aggregate
    const grouped: Record<string, any> = {};
    
    // If no grouping selected, just show total
    if (groupBy.length === 0) {
      const total = filtered.reduce((sum, row) => sum + row.cantidad, 0);
      return [{ _key: 'Total', _total: total }];
    }

    filtered.forEach(row => {
      // Create composite key based on selected group by fields
      const key = groupBy.map(k => row[k as keyof Movement] || 'N/A').join('|');
      
      if (!grouped[key]) {
        grouped[key] = { _key: key, _total: 0 };
        groupBy.forEach(k => {
          grouped[key][k] = row[k as keyof Movement] || 'N/A';
        });
      }
      
      grouped[key]._total += row.cantidad;
    });

    // 3. Sort by total descending
    return Object.values(grouped).sort((a, b) => b._total - a._total);
  }, [inventoryData, selectedBodega, groupBy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Reporting</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Inventory Movements</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.totalMovements}</h3>
            </div>
            <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-sky-500" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Leads in Funnel</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.activeLeads}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Monthly Sales (Closed)</p>
              <h3 className="text-3xl font-bold text-slate-900">${stats.monthlySales.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Dynamic Pivot Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mt-8 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Settings2 className="w-5 h-5 mr-2 text-slate-400" />
              Dynamic Data Summary
            </h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Bodega Filter */}
            <div className="w-full md:w-64 shrink-0">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filter by Warehouse</label>
              <select 
                value={selectedBodega} 
                onChange={(e) => setSelectedBodega(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none shadow-sm"
              >
                {BODEGAS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Group By Selectors */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Group Data By (Columns)</label>
              <div className="flex flex-wrap gap-2">
                {GROUPABLE_FIELDS.map(field => {
                  const isSelected = groupBy.includes(field.key);
                  return (
                    <button
                      key={field.key}
                      onClick={() => toggleGroupBy(field.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        isSelected 
                          ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Table Render */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {groupBy.length === 0 ? (
                  <th className="p-4">Summary</th>
                ) : (
                  groupBy.map(key => {
                    const label = GROUPABLE_FIELDS.find(f => f.key === key)?.label || key;
                    return <th key={key} className="p-4">{label}</th>;
                  })
                )}
                <th className="p-4 text-right">Total Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aggregatedData.map((row, idx) => (
                <tr key={row._key || idx} className="hover:bg-slate-50 transition-colors">
                  {groupBy.length === 0 ? (
                    <td className="p-4 text-sm font-medium text-slate-900">Grand Total</td>
                  ) : (
                    groupBy.map(key => (
                      <td key={key} className="p-4 text-sm text-slate-700">
                        {row[key]}
                      </td>
                    ))
                  )}
                  <td className="p-4 text-sm font-bold text-slate-900 text-right">
                    {row._total.toLocaleString()}
                  </td>
                </tr>
              ))}
              {aggregatedData.length === 0 && (
                <tr>
                  <td colSpan={groupBy.length + 1} className="p-8 text-center text-slate-500">
                    No data found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
