import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Users, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    inventoryValue: 0,
    activeLeads: 0,
    monthlySales: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      // Fetch Inventory Value
      const { data: inventory } = await supabase.from('inventory').select('stock, price');
      const inventoryValue = inventory?.reduce((acc, item) => acc + (item.stock * item.price), 0) || 0;

      // Fetch Active Leads
      const { count: activeLeads } = await supabase
        .from('sales_funnel')
        .select('*', { count: 'exact', head: true })
        .neq('stage', 'Closed');

      // Fetch Monthly Sales (Simplified: all closed deals value)
      const { data: closedDeals } = await supabase
        .from('sales_funnel')
        .select('value')
        .eq('stage', 'Closed');
      const monthlySales = closedDeals?.reduce((acc, deal) => acc + Number(deal.value), 0) || 0;

      setStats({
        inventoryValue,
        activeLeads: activeLeads || 0,
        monthlySales,
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Total Inventory Value</p>
              <h3 className="text-3xl font-bold text-white">${stats.inventoryValue.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Active Leads in Funnel</p>
              <h3 className="text-3xl font-bold text-white">{stats.activeLeads}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Monthly Sales (Closed)</p>
              <h3 className="text-3xl font-bold text-white">${stats.monthlySales.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-lg text-center mt-8">
         <h3 className="text-xl font-medium text-white mb-2">Welcome to SME Manager</h3>
         <p className="text-slate-400">Use the navigation menu to access Inventory, Sales Funnel, CRM, and Execution Stages.</p>
      </div>
    </div>
  );
}
