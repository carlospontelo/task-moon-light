import { useState } from 'react';
import { useSettings, CustomPaymentMethod } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ICONS = ['💳', '🏧', '⚡', '🐷', '💰', '🏦', '💵', '🪙', '📱', '🔄'];

export function PaymentMethodsSettings() {
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useSettings();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('💰');

  const startEdit = (pm: CustomPaymentMethod) => {
    setEditingId(pm.id);
    setEditLabel(pm.label);
    setEditIcon(pm.icon);
  };

  const saveEdit = async () => {
    if (!editingId || !editLabel.trim()) return;
    await updatePaymentMethod(editingId, { label: editLabel.trim(), icon: editIcon });
    setEditingId(null);
    toast({ title: 'Forma de pagamento atualizada' });
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    const key = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    await addPaymentMethod({ key, label: newLabel.trim(), icon: newIcon });
    setNewLabel('');
    setIsAdding(false);
    toast({ title: 'Forma de pagamento criada' });
  };

  const handleDelete = async (id: string) => {
    await deletePaymentMethod(id);
    toast({ title: 'Forma de pagamento removida' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Formas de Pagamento</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie os tipos de pagamento disponíveis</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nova
        </Button>
      </div>

      {isAdding && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
          <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Nome do método" className="h-9" />
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Ícone</p>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setNewIcon(ic)}
                  className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all",
                    newIcon === ic ? "border-primary bg-primary/10" : "border-transparent hover:bg-secondary")}>{ic}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} className="gap-1"><Check className="h-3.5 w-3.5" /> Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {paymentMethods.map(pm => (
          <div key={pm.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 group">
            {editingId === pm.id ? (
              <div className="flex-1 space-y-2">
                <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8" />
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setEditIcon(ic)}
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-sm border transition-all",
                        editIcon === ic ? "border-primary bg-primary/10" : "border-transparent hover:bg-secondary")}>{ic}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} className="h-7 gap-1"><Check className="h-3 w-3" /> Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7"><X className="h-3 w-3" /></Button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-lg">{pm.icon}</span>
                <span className="text-sm font-medium text-foreground">{pm.label}</span>
                <div className="flex-1" />
                <Button variant="ghost" size="icon-sm" onClick={() => startEdit(pm)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(pm.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
