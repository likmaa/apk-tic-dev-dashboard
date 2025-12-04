import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Users, Car, CircleDot, DollarSign, type LucideIcon } from 'lucide-react';
import { api } from '@/api/client';

// Composant réutilisable pour les cartes de statistiques (Stat Card)
// C'est la pierre angulaire d'un bon tableau de bord.
type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string | number;
  changeType?: 'positive' | 'negative';
  description?: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType, description }) => {
  const IconComponent = icon;
  const isPositive = changeType === 'positive';

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <IconComponent className="text-primary" size={22} />
        </div>
      </div>
      {change && (
        <div className="flex items-center gap-1 mt-4 text-xs">
          <span className={`flex items-center font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <ArrowUpRight size={14} className={!isPositive ? 'transform rotate-180' : ''} />
            {change}
          </span>
          <span className="text-gray-500">{description}</span>
        </div>
      )}
    </div>
  );
};

export default function DashboardOverview() {
  type ChangeType = 'positive' | 'negative';
  type Stat = {
    value: string;
    change: string;
    changeType: ChangeType;
    description: string;
  };

  const [stats, setStats] = useState<Record<string, Stat> | null>(null);
  const [dailyStats, setDailyStats] = useState<
    { date: string; gross_volume: number; completed_rides: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, dailyRes] = await Promise.all([
          api.get('/api/admin/stats/overview'),
          api.get('/api/admin/stats/drivers/daily/global', {
            params: {
              // dernieres 7 jours en timezone locale (la logique exacte est côté backend)
              // on laisse l'API utiliser sa valeur par défaut si besoin.
            },
          }),
        ]);

        const d = overviewRes.data;
        const onlineDrivers = d.online_drivers ?? 0;
        const activeRides = d.active_rides ?? 0;
        const completedRides = d.today_completed_rides ?? 0;
        const revenueAmount = d.today_revenue?.amount ?? 0;
        const currency = d.today_revenue?.currency ?? 'XOF';

        const formattedRevenue = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: currency,
        }).format(revenueAmount / 1);

        const mapped: Record<string, Stat> = {
          onlineDrivers: {
            value: String(onlineDrivers),
            change: '',
            changeType: 'positive',
            description: "chauffeurs connectés",
          },
          activeRides: {
            value: String(activeRides),
            change: '',
            changeType: 'positive',
            description: "courses en cours ou en attente",
          },
          dailyRevenue: {
            value: formattedRevenue,
            change: '',
            changeType: 'positive',
            description: "revenu brut aujourd'hui",
          },
          completedRides: {
            value: String(completedRides),
            change: '',
            changeType: 'positive',
            description: "courses terminées aujourd'hui",
          },
        };

        setStats(mapped);

        const dailyBody = dailyRes.data as {
          data: Array<{
            date: string;
            gross_volume: number;
            completed_rides: number;
          }>;
        };

        const normalizedDaily = (dailyBody.data || []).map((row) => ({
          date: row.date,
          gross_volume: row.gross_volume ?? 0,
          completed_rides: row.completed_rides ?? 0,
        }));
        setDailyStats(normalizedDaily);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Impossible de charger les statistiques du tableau de bord");
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  return (
    // Utilisation de 'space-y-6' pour créer un espacement vertical entre les sections
    <div className="space-y-8">
      {loading && <p className="text-sm text-gray-500">Chargement des statistiques...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {/* Section des cartes de statistiques principales */}
      {/* 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' rend la grille responsive */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Chauffeurs en ligne"
            value={stats.onlineDrivers.value}
            icon={Users}
            change={stats.onlineDrivers.change}
            changeType={stats.onlineDrivers.changeType}
            description={stats.onlineDrivers.description}
          />
          <StatCard
            title="Courses en cours"
            value={stats.activeRides.value}
            icon={CircleDot}
            change={stats.activeRides.change}
            changeType={stats.activeRides.changeType}
            description={stats.activeRides.description}
          />
          <StatCard
            title="Revenus du jour"
            value={stats.dailyRevenue.value}
            icon={DollarSign}
            change={stats.dailyRevenue.change}
            changeType={stats.dailyRevenue.changeType}
            description={stats.dailyRevenue.description}
          />
          <StatCard
            title="Courses terminées"
            value={stats.completedRides.value}
            icon={Car}
            change={stats.completedRides.change}
            changeType={stats.completedRides.changeType}
            description={stats.completedRides.description}
          />
        </div>
      )}

      {/* Section pour d'autres composants du tableau de bord */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte: Revenus quotidiens (mini chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900">Revenus quotidiens (7 derniers jours)</h3>
          <p className="text-sm text-gray-500 mt-1">Montant brut par jour.</p>
          <div className="mt-4">
            {dailyStats.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Pas encore de données suffisantes pour ce graphique.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {(() => {
                  const max = Math.max(...dailyStats.map((d) => d.gross_volume));
                  return dailyStats.map((d) => {
                    const ratio = max > 0 ? d.gross_volume / max : 0;
                    const height = Math.max(4, ratio * 120);
                    return (
                      <div key={d.date} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full rounded-t-md bg-primary/70 transition-all"
                          style={{ height: `${height}px` }}
                        />
                        <span className="mt-2 text-[10px] text-gray-500">
                          {new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>


        {/* Carte: Volume de courses quotidiennes (mini chart) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900">Volume de courses quotidiennes</h3>
          <p className="text-sm text-gray-500 mt-1">Nombre de courses complétées par jour.</p>
          <div className="mt-4">
            {dailyStats.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Pas encore de données suffisantes pour ce graphique.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {(() => {
                  const max = Math.max(...dailyStats.map((d) => d.completed_rides));
                  return dailyStats.map((d) => {
                    const ratio = max > 0 ? d.completed_rides / max : 0;
                    const height = Math.max(4, ratio * 120);
                    return (
                      <div key={d.date} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full rounded-t-md bg-emerald-500/70 transition-all"
                          style={{ height: `${height}px` }}
                        />
                        <span className="mt-2 text-[10px] text-gray-500">
                          {new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note pour les développeurs */}
      {/* <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg p-4">
        <p>
          <span className="font-semibold">Note :</span> Les cartes et graphiques utilisent déjà les endpoints du
          backend. Vous pouvez enrichir ce tableau de bord avec d'autres métriques et visualisations si besoin.
        </p>
      </div> */}
    </div>
  );
}
