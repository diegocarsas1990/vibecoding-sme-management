import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { GripVertical } from 'lucide-react';

const STAGES = ['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed'];

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
}

export default function SalesFunnel() {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    fetchDeals();

    const channel = supabase
      .channel('sales_funnel_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_funnel' }, () => {
        fetchDeals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchDeals() {
    const { data } = await supabase.from('sales_funnel').select('*').order('created_at', { ascending: false });
    if (data) setDeals(data);
  }

  async function moveDeal(id: string, newStage: string) {
    await supabase.from('sales_funnel').update({ stage: newStage }).eq('id', id);
  }

  const groupedDeals = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage);
    return acc;
  }, {} as Record<string, Deal[]>);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-bold text-slate-900">Sales Funnel</h2>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex space-x-6 min-w-max h-full">
          {STAGES.map((stage) => (
            <div key={stage} className="w-80 flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">{stage}</h3>
                <span className="bg-slate-200 text-slate-600 text-xs py-1 px-2 rounded-full font-medium">
                  {groupedDeals[stage]?.length || 0}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {groupedDeals[stage]?.map((deal) => (
                  <div 
                    key={deal.id} 
                    className="bg-white border border-slate-200 rounded-xl p-4 cursor-grab hover:border-sky-400 hover:shadow-md transition-all shadow-sm relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="pr-6">
                        <h4 className="text-sm font-medium text-slate-900 mb-1">{deal.title}</h4>
                        <p className="text-lg font-bold text-emerald-600">${deal.value.toLocaleString()}</p>
                      </div>
                      <GripVertical className="w-4 h-4 text-slate-300 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <div className="flex justify-between mt-4 pt-3 border-t border-slate-100">
                      <button 
                        disabled={STAGES.indexOf(stage) === 0}
                        onClick={() => moveDeal(deal.id, STAGES[STAGES.indexOf(stage) - 1])}
                        className="text-xs font-medium text-slate-400 hover:text-sky-500 disabled:opacity-30 transition-colors"
                      >
                        ← Prev
                      </button>
                      <button 
                        disabled={STAGES.indexOf(stage) === STAGES.length - 1}
                        onClick={() => moveDeal(deal.id, STAGES[STAGES.indexOf(stage) + 1])}
                        className="text-xs font-medium text-slate-400 hover:text-sky-500 disabled:opacity-30 transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                ))}
                {groupedDeals[stage]?.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-sm text-slate-400 font-medium">
                    No deals
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
