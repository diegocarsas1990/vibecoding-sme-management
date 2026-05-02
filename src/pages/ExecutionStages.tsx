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
      case 'Completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-sky-500" />;
      default: return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Execution Stages</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2 sm:p-6">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-sky-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  {getStatusIcon(task.status)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{task.title}</h3>
                  <p className="text-sm text-slate-600 max-w-xl">
                    {task.description || 'No description provided.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center sm:justify-end">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl font-medium">
              No tasks currently in execution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
