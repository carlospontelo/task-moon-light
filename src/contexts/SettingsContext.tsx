/* @refresh reset */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types
export interface CustomTag {
  id: string;
  key: string;
  label: string;
  bgColor: string;
  textColor: string;
}

export interface CustomCategory {
  id: string;
  key: string;
  label: string;
  icon: string;
  barColor: string;
}

export interface CustomPaymentMethod {
  id: string;
  key: string;
  label: string;
  icon: string;
  requiresManualPayment: boolean;
}

export interface UserPreferences {
  currency: string;
  weekStartDay: number;
  defaultTaskStatus: string;
}

// Defaults
const DEFAULT_TAGS: Omit<CustomTag, 'id'>[] = [
  { key: 'work', label: 'Trabalho', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  { key: 'personal', label: 'Pessoal', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' },
  { key: 'urgent', label: 'Urgente', bgColor: 'bg-red-500/20', textColor: 'text-red-400' },
  { key: 'study', label: 'Estudo', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400' },
  { key: 'health', label: 'Saúde', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400' },
];

const DEFAULT_CATEGORIES: Omit<CustomCategory, 'id'>[] = [
  { key: 'housing', label: 'Moradia', icon: '🏠', barColor: 'bg-blue-500' },
  { key: 'food', label: 'Alimentação', icon: '🍔', barColor: 'bg-orange-500' },
  { key: 'transport', label: 'Transporte', icon: '🚗', barColor: 'bg-cyan-500' },
  { key: 'leisure', label: 'Lazer', icon: '🎮', barColor: 'bg-pink-500' },
  { key: 'health', label: 'Saúde', icon: '💊', barColor: 'bg-red-500' },
  { key: 'work', label: 'Trabalho', icon: '💼', barColor: 'bg-slate-500' },
  { key: 'education', label: 'Educação', icon: '📚', barColor: 'bg-purple-500' },
  { key: 'shopping', label: 'Compras', icon: '🛒', barColor: 'bg-amber-500' },
  { key: 'investments', label: 'Investimentos', icon: '📈', barColor: 'bg-emerald-500' },
  { key: 'other', label: 'Outros', icon: '📦', barColor: 'bg-gray-500' },
];

const DEFAULT_PAYMENT_METHODS: Omit<CustomPaymentMethod, 'id'>[] = [
  { key: 'credit', label: 'Crédito', icon: '💳', requiresManualPayment: false },
  { key: 'debit', label: 'Débito', icon: '🏧', requiresManualPayment: false },
  { key: 'pix', label: 'Pix', icon: '⚡', requiresManualPayment: true },
  { key: 'cash_reserve', label: 'Caixinha', icon: '🐷', requiresManualPayment: true },
];

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'BRL',
  weekStartDay: 0,
  defaultTaskStatus: 'pending',
};

interface SettingsContextType {
  tags: CustomTag[];
  categories: CustomCategory[];
  paymentMethods: CustomPaymentMethod[];
  preferences: UserPreferences;
  loading: boolean;
  // Tag operations
  addTag: (tag: Omit<CustomTag, 'id'>) => Promise<void>;
  updateTag: (id: string, data: Partial<Omit<CustomTag, 'id'>>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  reorderTags: (orderedIds: string[]) => Promise<void>;
  // Category operations
  addCategory: (cat: Omit<CustomCategory, 'id'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Omit<CustomCategory, 'id'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Payment method operations
  addPaymentMethod: (pm: Omit<CustomPaymentMethod, 'id'>) => Promise<void>;
  updatePaymentMethod: (id: string, data: Partial<Omit<CustomPaymentMethod, 'id'>>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  // Preferences
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  // Lookup helpers
  getTagByKey: (key: string) => CustomTag | undefined;
  getCategoryByKey: (key: string) => CustomCategory | undefined;
  getPaymentMethodByKey: (key: string) => CustomPaymentMethod | undefined;
}

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tags, setTags] = useState<CustomTag[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<CustomPaymentMethod[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  const seedDefaults = useCallback(async () => {
    if (!user || seeded) return;
    setSeeded(true);

    // Check if user already has tags
    const { data: existingTags } = await supabase
      .from('custom_tags')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!existingTags?.length) {
      await supabase.from('custom_tags').insert(
        DEFAULT_TAGS.map(t => ({
          user_id: user.id,
          key: t.key,
          label: t.label,
          bg_color: t.bgColor,
          text_color: t.textColor,
        }))
      );
    }

    const { data: existingCats } = await supabase
      .from('custom_categories')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!existingCats?.length) {
      await supabase.from('custom_categories').insert(
        DEFAULT_CATEGORIES.map(c => ({
          user_id: user.id,
          key: c.key,
          label: c.label,
          icon: c.icon,
          bar_color: c.barColor,
        }))
      );
    }

    const { data: existingPm } = await supabase
      .from('custom_payment_methods')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!existingPm?.length) {
      await supabase.from('custom_payment_methods').insert(
        DEFAULT_PAYMENT_METHODS.map(pm => ({
          user_id: user.id,
          key: pm.key,
          label: pm.label,
          icon: pm.icon,
          requires_manual_payment: pm.requiresManualPayment,
        }))
      );
    }

    // Seed preferences
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!existingPrefs?.length) {
      await supabase.from('user_preferences').insert({ user_id: user.id });
    }
  }, [user, seeded]);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    await seedDefaults();

    const [tagsRes, catsRes, pmRes, prefsRes] = await Promise.all([
      supabase.from('custom_tags').select('*').eq('user_id', user.id).order('sort_order').order('created_at'),
      supabase.from('custom_categories').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('custom_payment_methods').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).limit(1),
    ]);

    if (tagsRes.data) {
      setTags(tagsRes.data.map((t: any) => ({
        id: t.id, key: t.key, label: t.label, bgColor: t.bg_color, textColor: t.text_color,
      })));
    }

    if (catsRes.data) {
      setCategories(catsRes.data.map((c: any) => ({
        id: c.id, key: c.key, label: c.label, icon: c.icon, barColor: c.bar_color,
      })));
    }

    if (pmRes.data) {
      setPaymentMethods(pmRes.data.map((pm: any) => ({
        id: pm.id, key: pm.key, label: pm.label, icon: pm.icon,
      })));
    }

    if (prefsRes.data?.[0]) {
      const p = prefsRes.data[0] as any;
      setPreferences({
        currency: p.currency,
        weekStartDay: p.week_start_day,
        defaultTaskStatus: p.default_task_status,
      });
    }

    setLoading(false);
  }, [user, seedDefaults]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Tag operations
  const addTag = async (tag: Omit<CustomTag, 'id'>) => {
    if (!user) return;
    await supabase.from('custom_tags').insert({
      user_id: user.id, key: tag.key, label: tag.label,
      bg_color: tag.bgColor, text_color: tag.textColor,
    });
    await fetchAll();
  };

  const updateTag = async (id: string, data: Partial<Omit<CustomTag, 'id'>>) => {
    const dbData: any = {};
    if (data.key !== undefined) dbData.key = data.key;
    if (data.label !== undefined) dbData.label = data.label;
    if (data.bgColor !== undefined) dbData.bg_color = data.bgColor;
    if (data.textColor !== undefined) dbData.text_color = data.textColor;
    await supabase.from('custom_tags').update(dbData).eq('id', id);
    await fetchAll();
  };

  const deleteTag = async (id: string) => {
    await supabase.from('custom_tags').delete().eq('id', id);
    await fetchAll();
  };

  const reorderTags = async (orderedIds: string[]) => {
    // Optimistic update
    setTags(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      return orderedIds.map(id => map.get(id)!).filter(Boolean);
    });
    // Persist sort_order
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from('custom_tags').update({ sort_order: index } as any).eq('id', id)
      )
    );
  };

  // Category operations
  const addCategory = async (cat: Omit<CustomCategory, 'id'>) => {
    if (!user) return;
    await supabase.from('custom_categories').insert({
      user_id: user.id, key: cat.key, label: cat.label,
      icon: cat.icon, bar_color: cat.barColor,
    });
    await fetchAll();
  };

  const updateCategory = async (id: string, data: Partial<Omit<CustomCategory, 'id'>>) => {
    const dbData: any = {};
    if (data.key !== undefined) dbData.key = data.key;
    if (data.label !== undefined) dbData.label = data.label;
    if (data.icon !== undefined) dbData.icon = data.icon;
    if (data.barColor !== undefined) dbData.bar_color = data.barColor;
    await supabase.from('custom_categories').update(dbData).eq('id', id);
    await fetchAll();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('custom_categories').delete().eq('id', id);
    await fetchAll();
  };

  // Payment method operations
  const addPaymentMethod = async (pm: Omit<CustomPaymentMethod, 'id'>) => {
    if (!user) return;
    await supabase.from('custom_payment_methods').insert({
      user_id: user.id, key: pm.key, label: pm.label, icon: pm.icon,
    });
    await fetchAll();
  };

  const updatePaymentMethod = async (id: string, data: Partial<Omit<CustomPaymentMethod, 'id'>>) => {
    const dbData: any = {};
    if (data.key !== undefined) dbData.key = data.key;
    if (data.label !== undefined) dbData.label = data.label;
    if (data.icon !== undefined) dbData.icon = data.icon;
    await supabase.from('custom_payment_methods').update(dbData).eq('id', id);
    await fetchAll();
  };

  const deletePaymentMethod = async (id: string) => {
    await supabase.from('custom_payment_methods').delete().eq('id', id);
    await fetchAll();
  };

  // Preferences
  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    if (!user) return;
    const dbData: any = {};
    if (prefs.currency !== undefined) dbData.currency = prefs.currency;
    if (prefs.weekStartDay !== undefined) dbData.week_start_day = prefs.weekStartDay;
    if (prefs.defaultTaskStatus !== undefined) dbData.default_task_status = prefs.defaultTaskStatus;
    await supabase.from('user_preferences').update(dbData).eq('user_id', user.id);
    setPreferences(prev => ({ ...prev, ...prefs }));
  };

  // Lookup helpers
  const getTagByKey = (key: string) => tags.find(t => t.key === key || t.id === key);
  const getCategoryByKey = (key: string) => categories.find(c => c.key === key);
  const getPaymentMethodByKey = (key: string) => paymentMethods.find(pm => pm.key === key);

  return (
    <SettingsContext.Provider value={{
      tags, categories, paymentMethods, preferences, loading,
      addTag, updateTag, deleteTag, reorderTags,
      addCategory, updateCategory, deleteCategory,
      addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
      updatePreferences,
      getTagByKey, getCategoryByKey, getPaymentMethodByKey,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
