import { api } from '@/api/client';
import React, { useEffect, useState } from 'react';
import { Send, Smartphone, Mail, MessageSquare, Users, History, Bell, Check, Info } from 'lucide-react';
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
  {
    id: 3,
    title: 'Maintenance plannifiée',
    target: 'Tous les utilisateurs',
    channels: ['SMS', 'Push'],
    date: '2023-10-20',
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
  description: string;
};

const ChannelSelector: React.FC<ChannelSelectorProps> = ({ icon: Icon, label, selected, onClick, description }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 relative p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:shadow-md ${selected
        ? 'bg-primary/5 border-primary shadow-sm'
        : 'bg-white border-gray-100 hover:border-gray-200'
        }`}
    >
      <div className={`absolute top-4 right-4 transition-transform duration-200 ${selected ? 'scale-100' : 'scale-0'}`}>
        <div className="bg-primary text-white p-1 rounded-full">
          <Check size={12} strokeWidth={3} />
        </div>
      </div>
      <div className={`mb-3 inline-flex p-2 rounded-lg transition-colors ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
        }`}>
        <Icon size={20} />
      </div>
      <div className="font-semibold text-gray-900 mb-1">{label}</div>
      <div className="text-xs text-gray-500 leading-relaxed font-medium">{description}</div>
    </button>
  );
};

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<string[]>(['Push']);
  const [target, setTarget] = useState('all_passengers');

  // Daily Tip State
  const [dailyTip, setDailyTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(false);
  const [savingTip, setSavingTip] = useState(false);

  const [history, setHistory] = useState(notificationHistory); // Init with mock data

  useEffect(() => {
    fetchHistory();
    fetchDailyTip();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/admin/notifications/history');
      if (res.data && Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch notification history', e);
      // Keep mock data on error for demo purposes if backend isn't ready
    }
  }

  const fetchDailyTip = async () => {
    try {
      setLoadingTip(true);
      const res = await api.get('/api/admin/settings');
      if (res.data?.daily_tip) {
        setDailyTip(res.data.daily_tip);
      }
    } catch (e) {
      console.error('Failed to fetch daily tip', e);
    } finally {
      setLoadingTip(false);
    }
  };

  const saveDailyTip = async () => {
    try {
      setSavingTip(true);
      await api.post('/api/admin/settings', { daily_tip: dailyTip });
      // Optional: Add a toast notification here
      alert('Conseil du jour mis à jour avec succès !');
    } catch (e) {
      console.error('Failed to save daily tip', e);
      alert('Erreur lors de la mise à jour du conseil.');
    } finally {
      setSavingTip(false);
    }
  };

  const handleChannelToggle = (channel: string) => {
    setChannels(prev =>
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  const handleSend = async () => {
    if (!title || !message || channels.length === 0) {
      alert('Veuillez remplir le titre, le message et sélectionner au moins un canal.');
      return;
    }

    try {
      await api.post('/api/admin/notifications/send', {
        title,
        message,
        channels,
        target,
        type: 'system'
      });
      alert('Notification envoyée avec succès !');
      setTitle('');
      setMessage('');
      fetchHistory(); // Refresh history
    } catch (e) {
      console.error('Failed to send notification', e);
      alert("Erreur lors de l'envoi de la notification.");
    }
  };

  const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* En-tête de la page */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Communication</h1>
          <p className="text-gray-500 mt-2 text-lg">Gérez vos campagnes de notifications et le contenu chauffeur.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Système actif
          </span>
        </div>
      </header>

      {/* SECTION : CONSEIL DU JOUR (Premium Feature Card) */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl border border-yellow-100 p-1 relative overflow-hidden shadow-sm">
        <div className="bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-[20px]">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-100 text-yellow-700 rounded-xl">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Conseil du Jour Chauffeur</h2>
                    <p className="text-gray-500 text-sm mt-0.5">S'affiche en tête du tableau de bord chauffeur</p>
                  </div>
                </div>
                {loadingTip && (
                  <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium px-3 py-1 bg-yellow-50 rounded-full">
                    <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                    Synchro...
                  </div>
                )}
              </div>

              <div className="relative group">
                <textarea
                  rows={2}
                  value={dailyTip}
                  onChange={(e) => setDailyTip(e.target.value)}
                  placeholder="Ex: Les zones à forte demande sont à Cocody ce matin..."
                  className="w-full bg-white rounded-xl border-2 border-yellow-100 shadow-sm p-4 text-gray-700 text-lg placeholder:text-gray-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 focus:outline-none transition-all resize-none"
                />
                <div className="absolute right-3 bottom-3 text-xs text-gray-400 font-medium bg-white/80 px-2 py-1 rounded-md backdrop-blur">
                  {dailyTip.length} caractères
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveDailyTip}
                  disabled={savingTip || loadingTip}
                  className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-yellow-500/20 disabled:opacity-50 disabled:shadow-none"
                >
                  {savingTip ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check size={18} strokeWidth={2.5} />
                      Mettre à jour
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="hidden lg:block w-px bg-yellow-200/50 self-stretch"></div>

            <div className="w-full lg:w-72 bg-yellow-100/50 rounded-xl p-4 border border-yellow-100">
              <h3 className="text-yellow-800 font-semibold mb-2 flex items-center gap-2 text-sm">
                <Info size={16} />
                Astuce
              </h3>
              <p className="text-yellow-800/80 text-sm leading-relaxed">
                Utilisez cet espace pour communiquer des infos urgentes, des conseils météo, ou des zones de majoration en temps réel.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Grille principale : Formulaire + Aperçu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* COLONNE GAUCHE : Formulaire de création (8 colonnes) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
            <div className="p-8 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Send size={20} />
                  </span>
                  Nouvelle Campagne
                </h2>

                {/* 1. Contenu */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-semibold text-gray-700 ml-1">Titre du message</label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Bonus chauffeur disponible 🎁"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-semibold text-gray-700 ml-1">Contenu</label>
                    <textarea
                      id="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Rédigez votre message ici..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium resize-none text-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100"></div>

              {/* 2. Ciblage & Canaux */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">Canaux de diffusion</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ChannelSelector
                      icon={Smartphone}
                      label="Push"
                      description="Notif. mobile instantanée"
                      selected={channels.includes('Push')}
                      onClick={() => handleChannelToggle('Push')}
                    />
                    <ChannelSelector
                      icon={Mail}
                      label="Email"
                      description="Pour les infos détaillées"
                      selected={channels.includes('Email')}
                      onClick={() => handleChannelToggle('Email')}
                    />
                    <ChannelSelector
                      icon={MessageSquare}
                      label="SMS"
                      description="Urgent (coût supp.)"
                      selected={channels.includes('SMS')}
                      onClick={() => handleChannelToggle('SMS')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="target" className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Audience Cible</label>
                  <div className="relative">
                    <select
                      id="target"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer hover:border-gray-300"
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <Users size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <button
                  onClick={handleSend}
                  className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/30 transform active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <span>Envoyer la campagne</span>
                  <Send size={20} className="stroke-[2.5]" />
                </button>
                <div className="text-center mt-3">
                  <p className="text-xs text-gray-400">Cette action est irréversible. Vérifiez l'aperçu avant d'envoyer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Aperçu (4 colonnes, sticky) */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bell size={20} className="text-gray-400" />
                Aperçu en direct
              </h2>

              {/* Phone Mockup */}
              <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[500px] w-[300px] shadow-2xl flex flex-col overflow-hidden">
                <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>

                {/* Screen Content */}
                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover relative group">

                  {/* Status Bar */}
                  <div className="h-12 w-full flex items-center justify-between px-6 pt-2 z-20 absolute top-0 text-white text-xs font-semibold">
                    <span>{currentTime}</span>
                    <div className="flex gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-white/20"></div>
                      <div className="w-4 h-4 rounded-full bg-white/20"></div>
                    </div>
                  </div>

                  {/* Backdrop blur overlay */}
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-0"></div>

                  {/* Notification Item */}
                  <div className={`transition-all duration-500 transform ${title || message ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'} absolute top-14 left-3 right-3 z-10`}>
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
                          <span className="font-bold text-lg">D</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-gray-900 truncate">Vibe</h4>
                            <span className="text-[10px] text-gray-500">Maintenant</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight mt-0.5 truncate">{title || 'Titre de la notif...'}</p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed opacity-90">{message || 'Le contenu de votre message s\'affichera ici.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400 font-medium">Apparence sur l'écran de verrouillage iOS</p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Section Historique */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History size={20} className="text-gray-400" />
            Historique récent
          </h2>
          <button className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
            Voir tout
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50/50">
              <tr>
                {['Titre', 'Audience', 'Canaux', 'Date', 'Statut'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((n: any) => (
                <tr key={n.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{n.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{n.target}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {(Array.isArray(n.channels) ? n.channels : [n.channels]).map((c: string) => (
                        <span key={c} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(n.created_at || n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Envoyée
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>Aucun historique disponible pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
