import { useSettings } from '@/contexts/SettingsContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PreferencesSettings() {
  const { preferences, updatePreferences } = useSettings();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Preferências</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Personalize o comportamento do aplicativo</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Moeda</Label>
          <Select value={preferences.currency} onValueChange={v => updatePreferences({ currency: v })}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">R$ - Real Brasileiro</SelectItem>
              <SelectItem value="USD">$ - Dólar Americano</SelectItem>
              <SelectItem value="EUR">€ - Euro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Primeiro dia da semana</Label>
          <Select value={String(preferences.weekStartDay)} onValueChange={v => updatePreferences({ weekStartDay: Number(v) })}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Domingo</SelectItem>
              <SelectItem value="1">Segunda-feira</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status padrão de novas tarefas</Label>
          <Select value={preferences.defaultTaskStatus} onValueChange={v => updatePreferences({ defaultTaskStatus: v })}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Mais opções de personalização serão adicionadas em breve.
        </p>
      </div>
    </div>
  );
}
