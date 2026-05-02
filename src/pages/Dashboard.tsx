import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, FileText } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMovements: 0,
    activeLeads: 0,
    monthlySales: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      // Fetch Total Movements instead of Value
      const { count: totalMovements } = await supabase
        .from('inventory_movements')
        .select('*', { count: 'exact', head: true });

      // Fetch Active Leads
      const { count: activeLeads } = await supabase
        .from('sales_funnel')
        .select('*', { count: 'exact', head: true })
        .neq('stage', 'Closed');

      // Fetch Monthly Sales
      const { data: closedDeals } = await supabase
        .from('sales_funnel')
        .select('value')
        .eq('stage', 'Closed');
      const monthlySales = closedDeals?.reduce((acc, deal) => acc + Number(deal.value), 0) || 0;

      setStats({
        totalMovements: totalMovements || 0,
        activeLeads: activeLeads || 0,
        monthlySales,
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Reporting</h2>
      </div>

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
      
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center mt-8">
         <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to SME Manager</h3>
         <p className="text-slate-500">Use the navigation menu to access Inventory, Sales Funnel, CRM, and Execution Stages.</p>
      </div>
    </div>
  );
}
