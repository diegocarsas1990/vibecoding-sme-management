import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Mail, Phone, User as UserIcon } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  purchase_history: string | null;
}

export default function CRM() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchCustomers() {
      const { data } = await supabase.from('customers').select('*').order('name');
      if (data) setCustomers(data);
    }
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Customer Directory</h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-700 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:border-blue-500/50 transition-colors">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                <UserIcon className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{customer.name}</h3>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-slate-400">
                <Mail className="w-4 h-4 mr-3 text-slate-500" />
                {customer.email || 'No email provided'}
              </div>
              <div className="flex items-center text-sm text-slate-400">
                <Phone className="w-4 h-4 mr-3 text-slate-500" />
                {customer.phone || 'No phone provided'}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Purchase History</p>
              <p className="text-sm text-slate-300">
                {customer.purchase_history || 'No history recorded.'}
              </p>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
}
