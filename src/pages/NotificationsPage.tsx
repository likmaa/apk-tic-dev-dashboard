import React, { useState } from 'react';
import { Send, Smartphone, Mail, MessageSquare, Users, User, History } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// --- Données Statiques (pour l'historique) ---
const notificationHistory = [
  {
    id: 1,
    title: '🎉 Offre Spéciale Week-end',
    target: 'Tous les passagers',
    channels: ['Push', 'Email'],
    date: '2023-10-25',
    status: 'Envoyée',
  },
  {
    id: 2,
    title: 'Mise à jour des documents requise',
    target: 'Chauffeurs (Actifs)',
    channels: ['Push'],
    date: '2023-10-22',
    status: 'Envoyée',
  },
];
// -------------------------------------------------------------

// Composant pour un choix de canal (Push, Email, SMS)
type ChannelSelectorProps = {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onClick: () => void;
};

const ChannelSelector: React.FC<ChannelSelectorProps> = ({ icon: Icon, label, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
        selected ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-gray-50 text-gray-600 hover:border-gray-400'
      }`}
    >
      <Icon size={24} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<string[]>(['Push']);
  const [target, setTarget] = useState('all_passengers');

  const handleChannelToggle = (channel: string) => {
    setChannels(prev =>
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  const handleSend = () => {
    if (!title || !message || channels.length === 0) {
      alert('Veuillez remplir le titre, le message et sélectionner au moins un canal.');
      return;
    }
    console.log('Envoi de la notification:', { title, message, channels, target });
    // Ici, vous appelleriez l'API pour envoyer la notification
    alert('Notification envoyée (simulation) !');
  };

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Communication & Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Envoyez des messages ciblés à vos utilisateurs via différents canaux.</p>
      </header>

      {/* Grille principale : Compositeur à gauche, Aperçu à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Section Compositeur */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Créer une nouvelle notification</h2>
          
          {/* 1. Contenu du message */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre de la notification</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Offre spéciale ce week-end !"
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Détaillez votre message ici..."
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {/* 2. Canaux de diffusion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Canaux de diffusion</label>
            <div className="flex gap-4">
              <ChannelSelector icon={Smartphone} label="Push" selected={channels.includes('Push')} onClick={() => handleChannelToggle('Push')} />
              <ChannelSelector icon={Mail} label="Email" selected={channels.includes('Email')} onClick={() => handleChannelToggle('Email')} />
              <ChannelSelector icon={MessageSquare} label="SMS" selected={channels.includes('SMS')} onClick={() => handleChannelToggle('SMS')} />
            </div>
          </div>

          {/* 3. Audience Cible */}
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700">Audience Cible</label>
            <select
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              <optgroup label="Passagers">
                <option value="all_passengers">Tous les passagers</option>
                <option value="active_passengers">Passagers actifs (30 derniers jours)</option>
              </optgroup>
              <optgroup label="Chauffeurs">
                <option value="all_drivers">Tous les chauffeurs</option>
                <option value="active_drivers">Chauffeurs actifs</option>
              </optgroup>
            </select>
          </div>

          {/* 4. Action d'envoi */}
          <div className="pt-4 border-t">
            <button
              onClick={handleSend}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Send size={18} />
              Envoyer la notification
            </button>
          </div>
        </div>

        {/* Section Aperçu */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aperçu (Notification Push)</h2>
          <div className="bg-gray-900 rounded-3xl p-2 w-full max-w-xs mx-auto shadow-2xl">
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="bg-gray-800/80 backdrop-blur-xl p-3 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">D</div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{title || 'Titre de votre notification'}</p>
                    <p className="text-xs text-gray-300 truncate">{message || 'Votre message apparaîtra ici.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Historique */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><History size={20}/> Historique des envois</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Titre', 'Audience', 'Canaux', 'Date', 'Statut'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notificationHistory.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {n.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {n.target}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {n.channels.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(n.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                    {n.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
