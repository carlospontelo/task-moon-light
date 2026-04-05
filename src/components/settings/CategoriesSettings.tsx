import { useState } from 'react';
import { useSettings, CustomCategory } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import EmojiPicker, { Theme } from 'emoji-picker-react';

const BAR_COLORS = [
  'bg-blue-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500', 'bg-red-500',
  'bg-slate-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500', 'bg-gray-500',
  'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-lime-500',
];

export function CategoriesSettings() {
  const { categories, addCategory, updateCategory, deleteCategory } = useSettings();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newColor, setNewColor] = useState('bg-gray-500');
  const [newEmojiOpen, setNewEmojiOpen] = useState(false);
  const [editEmojiOpen, setEditEmojiOpen] = useState(false);

  const startEdit = (cat: CustomCategory) => {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setEditIcon(cat.icon);
    setEditColor(cat.barColor);
  };

  const saveEdit = async () => {
    if (!editingId || !editLabel.trim()) return;
    await updateCategory(editingId, { label: editLabel.trim(), icon: editIcon, barColor: editColor });
    setEditingId(null);
    toast({ title: 'Categoria atualizada' });
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    const key = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    await addCategory({ key, label: newLabel.trim(), icon: newIcon, barColor: newColor });
    setNewLabel('');
    setIsAdding(false);
    toast({ title: 'Categoria criada' });
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    toast({ title: 'Categoria removida' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Categorias Financeiras</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie categorias de despesas</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nova
        </Button>
      </div>

      {isAdding && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
          <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Nome da categoria" className="h-9" />
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Ícone</p>
            <Popover open={newEmojiOpen} onOpenChange={setNewEmojiOpen}>
              <PopoverTrigger asChild>
                <button className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-xl hover:bg-secondary transition-colors">
                  {newIcon}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0" align="start">
                <EmojiPicker
                  theme={Theme.DARK}
                  searchPlaceholder="Buscar emoji..."
                  width={300}
                  height={400}
                  lazyLoadEmojis
                  onEmojiClick={(emojiData) => {
                    setNewIcon(emojiData.emoji);
                    setNewEmojiOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Cor</p>
            <div className="flex flex-wrap gap-1.5">
              {BAR_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  className={cn("w-6 h-6 rounded-full border-2 transition-all", c,
                    newColor === c ? "border-foreground scale-110" : "border-transparent")} />
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
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 group">
            {editingId === cat.id ? (
              <div className="flex-1 space-y-2">
                <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Ícone</p>
                  <Popover open={editEmojiOpen} onOpenChange={setEditEmojiOpen}>
                    <PopoverTrigger asChild>
                      <button className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-lg hover:bg-secondary transition-colors">
                        {editIcon}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-0" align="start">
                      <EmojiPicker
                        theme={Theme.DARK}
                        searchPlaceholder="Buscar emoji..."
                        width={300}
                        height={400}
                        lazyLoadEmojis
                        onEmojiClick={(emojiData) => {
                          setEditIcon(emojiData.emoji);
                          setEditEmojiOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Cor</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BAR_COLORS.map(c => (
                      <button key={c} onClick={() => setEditColor(c)}
                        className={cn("w-5 h-5 rounded-full border-2 transition-all", c,
                          editColor === c ? "border-foreground scale-110" : "border-transparent")} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} className="h-7 gap-1"><Check className="h-3 w-3" /> Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7"><X className="h-3 w-3" /></Button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
                <span className={cn("w-3 h-3 rounded-full", cat.barColor)} />
                <div className="flex-1" />
                <Button variant="ghost" size="icon-sm" onClick={() => startEdit(cat)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(cat.id)}
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
