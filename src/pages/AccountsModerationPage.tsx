import React, { useEffect, useState } from 'react';
import { Shield, User, Car, Clock, Search, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { api } from '@/api/client';

// --- Données Types pour la Modération ---
type ModerationQueueItem = {
  id: string;
  type: string;
  subject_type: 'driver' | 'passenger';
  subject_name: string;
  reporter_name: string;
  reason: string;
  date: string;
  status: string;
};

type ModerationLogItem = {
  id: string;
  date: string;
  moderator: string;
  action: string;
  target_name: string;
  target_type: 'driver' | 'passenger';
  reason: string;
};
// -------------------------------------------------------------

// Composant pour afficher une icône en fonction du type de compte
const AccountTypeIcon = ({ type }: { type: 'driver' | 'passenger' }) => {
  if (type === 'driver') return <Car className="text-gray-500" size={18} />;
  return <User className="text-gray-500" size={18} />;
};

// Types pour les actions de modération
type ModerationAction = 'suspended' | 'banned' | 'reinstated' | 'warned';

// Composant Badge pour les actions de modération
const ActionBadge = ({ action }: { action: ModerationAction }) => {
    const config: Record<ModerationAction, { icon: JSX.Element; style: string }> = {
        suspended: { icon: <ShieldAlert size={14} />, style: 'bg-orange-100 text-orange-800' },
        banned: { icon: <ShieldX size={14} />, style: 'bg-red-100 text-red-800' },
        reinstated: { icon: <ShieldCheck size={14} />, style: 'bg-green-100 text-green-800' },
        warned: { icon: <ShieldAlert size={14} />, style: 'bg-yellow-100 text-yellow-800' },
    };
    const item = config[action];
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${item.style}`}>{item.icon}{action.charAt(0).toUpperCase() + action.slice(1)}</span>;
};


export default function AccountsModerationPage() {
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [log, setLog] = useState<ModerationLogItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchQueueAndLogs = async () => {
      try {
        const [queueRes, logsRes] = await Promise.all([
          api.get('/api/admin/moderation/queue'),
          api.get('/api/admin/moderation/logs'),
        ]);

        const queueBody = queueRes.data as { data: ModerationQueueItem[] };
        const logsBody = logsRes.data as { data: ModerationLogItem[] };

        setQueue(queueBody.data);
        setLog(logsBody.data);
      } catch (e) {
        // en cas d'erreur, on laisse les listes vides
      }
    };

    fetchQueueAndLogs();
  }, []);

  const filteredLog = log.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      entry.moderator.toLowerCase().includes(q) ||
      entry.target_name.toLowerCase().includes(q) ||
      entry.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Modération des Comptes</h1>
        <p className="text-sm text-gray-500 mt-1">Traitez les signalements, gérez les suspensions et consultez l'historique des actions.</p>
      </header>

      {/* Section 1: File d'attente des cas à traiter */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cas en Attente de Révision</h2>
        <div className="space-y-4">
          {queue.map(item => (
            <div key={item.id} className="p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <AccountTypeIcon type={item.subject_type as any} />
                <div>
                  <p className="font-semibold text-gray-800">{item.reason}</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">{item.subject_name}</span> signalé par <span className="font-medium">{item.reporter_name}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 flex-shrink-0">
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={14} />
                  <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <button className="px-4 py-1.5 text-sm bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark">
                  Traiter le cas
                </button>
              </div>
            </div>
          ))}
          {queue.length === 0 && (
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <ShieldCheck size={40} className="mx-auto text-green-500" />
                <h3 className="mt-3 text-md font-semibold text-gray-800">Aucun cas en attente</h3>
                <p className="mt-1 text-sm text-gray-500">La file de modération est vide.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Journal d'audit des actions de modération */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Journal des Actions de Modération</h2>
            <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, modérateur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Modérateur', 'Action', 'Cible', 'Motif'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLog.map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.date).toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{log.moderator}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><ActionBadge action={log.action as ModerationAction} /></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <AccountTypeIcon type={log.target_type as any} />
                        <span className="text-sm font-medium text-gray-800">{log.target_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
