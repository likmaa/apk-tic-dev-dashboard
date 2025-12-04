import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, UserPlus, SlidersHorizontal, ShieldCheck, ShieldAlert } from 'lucide-react';
import { api } from '@/api/client';

// Interfaces et Types
type PassengerStatus = 'active' | 'banned';
interface Passenger {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: PassengerStatus;
  total_rides: number;
  total_spent: number;
  join_date: string;
}

interface RideHistoryItem {
  id: number;
  status: string;
  fare_amount: number;
  currency: string;
  created_at?: string | null;
  completed_at?: string | null;
}

// Composant Badge de Statut pour les passagers
const PassengerStatusBadge = ({ status }: { status: PassengerStatus }) => {
  const statusConfig = {
    active: { icon: <ShieldCheck size={14} />, style: 'bg-blue-100 text-blue-800' },
    banned: { icon: <ShieldAlert size={14} />, style: 'bg-red-100 text-red-800' },
  };
  const config = statusConfig[status] || { icon: null, style: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.style}`}>
      {config.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function PassengersDBPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [ridesError, setRidesError] = useState<string | null>(null);
  const [ridesStatusFilter, setRidesStatusFilter] = useState<string>('all');
  const [ridesFromDate, setRidesFromDate] = useState<string>('');
  const [ridesToDate, setRidesToDate] = useState<string>('');

  useEffect(() => {
    const fetchPassengers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/admin/users', {
          params: { role: 'passenger', per_page: 200 },
        });

        const data = (res.data?.data ?? res.data) as any[];

        const mapped: Passenger[] = data.map((u) => {
          let status: PassengerStatus = 'active';
          if (u.is_banned === true) {
            status = 'banned';
          }

          return {
            id: u.id,
            name: u.name ?? '',
            email: u.email ?? '',
            phone: u.phone ?? '',
            status,
            total_rides: u.total_rides ?? u.rides_count ?? 0,
            total_spent: u.total_spent ?? 0,
            join_date: u.created_at ?? new Date().toISOString(),
          };
        });

        setPassengers(mapped);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Erreur de chargement des passagers');
      } finally {
        setLoading(false);
      }
    };

    fetchPassengers();
  }, []);

  const openPassengerModal = async (p: Passenger) => {
    setSelectedPassenger(p);
    setRides([]);
    setRidesError(null);
    setRidesStatusFilter('all');
    setRidesFromDate('');
    setRidesToDate('');
    setRidesLoading(true);
    try {
      const res = await api.get(`/api/admin/passengers/${p.id}/rides`, { params: { per_page: 50 } });
      const data = (res.data?.data ?? res.data) as any[];
      setRides(
        data.map((r) => ({
          id: r.id,
          status: r.status,
          fare_amount: r.fare_amount ?? 0,
          currency: r.currency ?? 'XOF',
          distance_m: r.distance_m ?? null,
          duration_s: r.duration_s ?? null,
          driver_id: r.driver_id ?? null,
          created_at: r.created_at ?? null,
          completed_at: r.completed_at ?? null,
        }))
      );
    } catch (e: any) {
      setRidesError(e?.response?.data?.message || "Erreur de chargement de l'historique des courses");
    } finally {
      setRidesLoading(false);
    }
  };

  const closePassengerModal = () => {
    setSelectedPassenger(null);
    setRides([]);
    setRidesError(null);
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('fr-FR');
    } catch {
      return value;
    }
  };

  const getFilteredModalRides = () => {
    return rides
      .filter((r) => {
        if (ridesStatusFilter === 'all') return true;
        return r.status === ridesStatusFilter;
      })
      .filter((r) => {
        if (!ridesFromDate && !ridesToDate) return true;
        if (!r.created_at) return false;
        const d = new Date(r.created_at);
        if (ridesFromDate) {
          const from = new Date(ridesFromDate);
          if (d < from) return false;
        }
        if (ridesToDate) {
          const to = new Date(ridesToDate);
          to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
        return true;
      });
  };

  const formatDistanceKm = (m?: number | null) => {
    if (!m || m <= 0) return '-';
    return `${(m / 1000).toFixed(1)} km`;
  };

  const formatDurationMin = (s?: number | null) => {
    if (!s || s <= 0) return '-';
    return `${Math.round(s / 60)} min`;
  };

  // Logique de filtrage et de recherche
  const filteredData = passengers
    .filter(passenger => {
      if (statusFilter === 'all') return true;
      return passenger.status === statusFilter;
    })
    .filter(passenger =>
      passenger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passenger.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passenger.phone.includes(searchTerm)
    );

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Passagers</h1>
        <p className="text-sm text-gray-500 mt-1">Consultez la base de données des utilisateurs, leur activité et gérez leurs comptes.</p>
      </header>

      {/* Carte principale contenant les outils et le tableau */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {loading && <p className="text-sm text-gray-500">Chargement des passagers...</p>}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {/* Barre d'outils : Recherche, Filtres */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-2/5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="banned">Banni</option>
            </select>
            {/* On pourrait ajouter un bouton "Exporter" ou "Ajouter" ici si nécessaire */}
          </div>
        </div>

        {/* Tableau des passagers */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                {['Passager', 'Activité', 'Statut', 'Inscrit le', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((passenger) => (
                <tr key={passenger.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img className="h-10 w-10 rounded-full" src={`https://ui-avatars.com/api/?name=${passenger.name.replace(' ', '+' )}&background=random`} alt="" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{passenger.name}</div>
                        <div className="text-sm text-gray-500">{passenger.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{passenger.total_rides} courses</div>
                    <div className="text-sm text-gray-500">{passenger.total_spent.toFixed(2)} FCFA dépensés</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PassengerStatusBadge status={passenger.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(passenger.join_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button
                      className="text-primary hover:underline"
                      onClick={() => navigate(`/passengers/${passenger.id}`)}
                    >
                      Page profil
                    </button>
                    <button
                      className="text-gray-600 hover:underline"
                      onClick={() => openPassengerModal(passenger)}
                    >
                      Voir historique
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
            <div className="text-center p-10">
                <User size={48} className="mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-800">Aucun passager trouvé</h3>
                <p className="mt-1 text-sm text-gray-500">Ajustez votre recherche ou vos filtres pour afficher des résultats.</p>
            </div>
        )}
      </div>
      {selectedPassenger && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Historique des courses</h2>
                <p className="text-xs text-gray-500">
                  Passager : {selectedPassenger.name} ({selectedPassenger.phone})
                </p>
              </div>
              <button
                onClick={closePassengerModal}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Fermer
              </button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-auto">
              {ridesLoading && (
                <p className="text-sm text-gray-500">Chargement de l'historique des courses...</p>
              )}
              {ridesError && (
                <p className="text-sm text-red-600 mb-2">{ridesError}</p>
              )}
              {!ridesLoading && !ridesError && (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4 items-end">
                    <div className="flex flex-col text-sm">
                      <label className="text-gray-600 mb-1">Filtrer par statut</label>
                      <select
                        value={ridesStatusFilter}
                        onChange={(e) => setRidesStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="all">Tous</option>
                        <option value="requested">Demandé</option>
                        <option value="accepted">Accepté</option>
                        <option value="ongoing">En cours</option>
                        <option value="completed">Terminé</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </div>
                    <div className="flex flex-col text-sm">
                      <label className="text-gray-600 mb-1">Date min</label>
                      <input
                        type="date"
                        value={ridesFromDate}
                        onChange={(e) => setRidesFromDate(e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="flex flex-col text-sm">
                      <label className="text-gray-600 mb-1">Date max</label>
                      <input
                        type="date"
                        value={ridesToDate}
                        onChange={(e) => setRidesToDate(e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  {getFilteredModalRides().length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune course trouvée pour ce passager.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Durée</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Chauffeur</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Créée le</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Terminée le</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {getFilteredModalRides().map((ride) => (
                            <tr key={ride.id}>
                              <td className="px-4 py-2 whitespace-nowrap">#{ride.id}</td>
                              <td className="px-4 py-2 whitespace-nowrap capitalize">{ride.status}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                {ride.fare_amount} {ride.currency}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">{formatDistanceKm((ride as any).distance_m)}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{formatDurationMin((ride as any).duration_s)}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{(ride as any).driver_id ? `#${(ride as any).driver_id}` : '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(ride.created_at)}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(ride.completed_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
