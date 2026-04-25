import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Minus, Search, Edit2 } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('inventory').select('*').order('name');
    if (data) setProducts(data);
  }

  async function updateStock(id: string, currentStock: number, delta: number) {
    const newStock = Math.max(0, currentStock + delta);
    await supabase.from('inventory').update({ stock: newStock }).eq('id', id);
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Inventory Management</h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-700 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-400">
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium">Product Name</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Cost</th>
                <th className="p-4 font-medium text-center">Stock</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="p-4 text-sm font-mono text-slate-400">{product.sku}</td>
                  <td className="p-4 text-sm font-medium text-white">{product.name}</td>
                  <td className="p-4 text-sm text-emerald-400">${product.price.toLocaleString()}</td>
                  <td className="p-4 text-sm text-slate-400">${product.cost.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <button 
                        onClick={() => updateStock(product.id, product.stock, -1)}
                        className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`text-sm font-bold w-8 text-center ${product.stock <= 5 ? 'text-red-400' : 'text-white'}`}>
                        {product.stock}
                      </span>
                      <button 
                        onClick={() => updateStock(product.id, product.stock, 1)}
                        className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors inline-flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No products found. Add some data directly in Supabase or expand the app to include a creation form.
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
