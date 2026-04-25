import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'Pending' | 'In Progress' | 'Completed';
  created_at: string;
}

export default function ExecutionStages() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await supabase.from('execution_tasks').select('*').order('created_at', { ascending: false });
      if (data) setTasks(data as Task[]);
    }
    fetchTasks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-blue-400" />;
      default: return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-700/30 text-slate-400 border-slate-600/50';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Execution Stages</h2>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-lg p-2 sm:p-6">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 sm:p-5 hover:border-blue-500/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  {getStatusIcon(task.status)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{task.title}</h3>
                  <p className="text-sm text-slate-400 max-w-xl">
                    {task.description || 'No description provided.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center sm:justify-end">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-700/50 rounded-xl">
              No tasks currently in execution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
