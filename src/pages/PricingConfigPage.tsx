import React, { useEffect, useState } from 'react';
import { DollarSign, Map, Clock, Zap, Save, Loader2 } from 'lucide-react';
import { api } from '@/api/client';

// Interface pour la configuration
interface PricingConfig {
  base_fare: number;
  price_per_km: number;
  price_per_minute: number;
  min_fare: number;
  peak_hours: {
    enabled: boolean;
    multiplier: number;
    start_time: string;
    end_time: string;
  };
}

// Props typées pour le composant PricingInput
interface PricingInputProps {
  label: string;
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit?: string;
  description?: string;
}

// Composant réutilisable pour un champ de formulaire de tarification
const PricingInput: React.FC<PricingInputProps> = ({ label, value, onChange, unit, description }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative mt-1">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-gray-500 sm:text-sm">{unit}</span>
      </div>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={onChange}
        className="w-full rounded-md border-gray-300 pl-7 pr-12 py-2 text-right shadow-sm focus:border-primary focus:ring-primary"
      />
    </div>
    {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
  </div>
);

export default function PricingConfigPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/admin/pricing');
        const data = res.data as any;
        const cfg: PricingConfig = {
          base_fare: Number(data.base_fare ?? 500),
          price_per_km: Number(data.per_km ?? data.price_per_km ?? 150),
          price_per_minute: Number(data.per_min ?? data.price_per_minute ?? 50),
          min_fare: Number(data.min_fare ?? 1000),
          peak_hours: {
            enabled: Boolean(data.peak_hours?.enabled ?? false),
            multiplier: Number(data.peak_hours?.multiplier ?? 1.0),
            start_time: data.peak_hours?.start_time ?? '17:00',
            end_time: data.peak_hours?.end_time ?? '20:00',
          },
        };
        setConfig(cfg);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Erreur de chargement de la configuration tarifaire");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const [section, key] = name.split('.');

    if (key) { // Gère les objets imbriqués comme 'peak_hours'
      if (section === 'peak_hours') {
        const k = key as keyof PricingConfig['peak_hours'];
        const v = (type === 'checkbox' ? checked : value) as PricingConfig['peak_hours'][typeof k];
        setConfig(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            peak_hours: {
              ...prev.peak_hours,
              [k]: v,
            },
          };
        });
      }
      return;
    } else {
      // Branche pour des champs de premier niveau (non utilisée par les inputs actuels)
      type TopLevelNumericKey = 'base_fare' | 'price_per_km' | 'price_per_minute';
      const topKey = name as TopLevelNumericKey;
      setConfig(prev => {
        if (!prev) return prev;
        return { ...prev, [topKey]: parseFloat(value) };
      });
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        base_fare: config.base_fare,
        per_km: config.price_per_km,
        per_min: config.price_per_minute,
        min_fare: config.min_fare,
        peak_hours: config.peak_hours,
      };
      const res = await api.put('/api/admin/pricing', payload);
      const data = res.data as any;
      const cfg: PricingConfig = {
        base_fare: Number(data.base_fare ?? config.base_fare),
        price_per_km: Number(data.per_km ?? config.price_per_km),
        price_per_minute: Number(data.per_min ?? config.price_per_minute),
        min_fare: Number(data.min_fare ?? config.min_fare ?? 1000),
        peak_hours: {
          enabled: Boolean(data.peak_hours?.enabled ?? config.peak_hours.enabled),
          multiplier: Number(data.peak_hours?.multiplier ?? config.peak_hours.multiplier),
          start_time: data.peak_hours?.start_time ?? config.peak_hours.start_time,
          end_time: data.peak_hours?.end_time ?? config.peak_hours.end_time,
        },
      };
      setConfig(cfg);
      // Ici, tu pourras plus tard afficher un toast de succès
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration Tarifaire</h1>
          <p className="text-sm text-gray-500 mt-1">Définissez les paramètres de calcul des prix pour toutes les courses.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-400"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder les changements'}
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Chargement de la configuration tarifaire...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!config && !loading && !error && (
        <p className="text-sm text-gray-500">Aucune configuration tarifaire disponible.</p>
      )}

      {/* Grille de configuration */}
      {config && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Carte de Tarification de Base */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <DollarSign className="text-primary" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Tarification Standard</h2>
          </div>
          <PricingInput
            label="Tarif de base"
            unit="FCFA"
            value={config.base_fare}
            onChange={e =>
              setConfig(prev => {
                if (!prev) return prev;
                return { ...prev, base_fare: parseFloat(e.target.value) };
              })
            }
            description="Coût fixe appliqué à chaque début de course."
          />
          <PricingInput
            label="Prix au kilomètre"
            unit="FCFA"
            value={config.price_per_km}
            onChange={e =>
              setConfig(prev => {
                if (!prev) return prev;
                return { ...prev, price_per_km: parseFloat(e.target.value) };
              })
            }
            description="Coût additionnel pour chaque kilomètre parcouru."
          />
          <PricingInput
            label="Prix à la minute"
            unit="FCFA"
            value={config.price_per_minute}
            onChange={e =>
              setConfig(prev => {
                if (!prev) return prev;
                return { ...prev, price_per_minute: parseFloat(e.target.value) };
              })
            }
            description="Coût additionnel pour chaque minute passée en course."
          />

          <PricingInput
            label="Tarif minimum"
            unit="FCFA"
            value={config.min_fare}
            onChange={e =>
              setConfig(prev => {
                if (!prev) return prev;
                return { ...prev, min_fare: parseFloat(e.target.value) };
              })
            }
            description="Montant minimum facturé pour une course, même si le calcul donne moins."
          />
        </div>

        {/* Carte des Politiques Spéciales */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="text-primary" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Majorations et Politiques Spéciales</h2>
          </div>
          
          {/* Heures de pointe */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="peak-enabled" className="font-medium text-gray-800">Majoration Heures de Pointe</label>
              <input
                id="peak-enabled"
                name="peak_hours.enabled"
                type="checkbox"
                checked={config.peak_hours.enabled}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>
            {config.peak_hours.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                <PricingInput
                  label="Multiplicateur"
                  unit="x"
                  value={config.peak_hours.multiplier}
                  onChange={e =>
                    setConfig(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        peak_hours: {
                          ...prev.peak_hours,
                          multiplier: parseFloat(e.target.value),
                        },
                      };
                    })
                  }
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Début</label>
                  <input type="time" name="peak_hours.start_time" value={config.peak_hours.start_time} onChange={handleInputChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fin</label>
                  <input type="time" name="peak_hours.end_time" value={config.peak_hours.end_time} onChange={handleInputChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Espace réservé pour d'autres politiques */}
          <div className="text-center p-4 border-2 border-dashed rounded-lg">
            <Map className="mx-auto text-gray-400" size={32} />
            <p className="mt-2 text-sm text-gray-500">Configuration des zones tarifaires à venir.</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
