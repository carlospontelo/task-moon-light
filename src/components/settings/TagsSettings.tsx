import { useState } from 'react';
import { useSettings, CustomTag } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const COLOR_OPTIONS = [
  { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Azul' },
  { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Roxo' },
  { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Vermelho' },
  { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Âmbar' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Verde' },
  { bg: 'bg-pink-500/20', text: 'text-pink-400', label: 'Rosa' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Ciano' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Laranja' },
  { bg: 'bg-teal-500/20', text: 'text-teal-400', label: 'Teal' },
  { bg: 'bg-indigo-500/20', text: 'text-indigo-400', label: 'Índigo' },
];

export function TagsSettings() {
  const { tags, addTag, updateTag, deleteTag } = useSettings();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editBg, setEditBg] = useState('');
  const [editText, setEditText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newBg, setNewBg] = useState(COLOR_OPTIONS[0].bg);
  const [newText, setNewText] = useState(COLOR_OPTIONS[0].text);

  const startEdit = (tag: CustomTag) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
    setEditBg(tag.bgColor);
    setEditText(tag.textColor);
  };

  const saveEdit = async () => {
    if (!editingId || !editLabel.trim()) return;
    await updateTag(editingId, { label: editLabel.trim(), bgColor: editBg, textColor: editText });
    setEditingId(null);
    toast({ title: 'Tag atualizada' });
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    const key = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    await addTag({ key, label: newLabel.trim(), bgColor: newBg, textColor: newText });
    setNewLabel('');
    setIsAdding(false);
    toast({ title: 'Tag criada' });
  };

  const handleDelete = async (id: string) => {
    await deleteTag(id);
    toast({ title: 'Tag removida' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Tags de Tarefas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie as tags disponíveis para organizar tarefas</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nova
        </Button>
      </div>

      {isAdding && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
          <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Nome da tag" className="h-9" />
          <div className="flex flex-wrap gap-1.5">
            {COLOR_OPTIONS.map(c => (
              <button key={c.bg} onClick={() => { setNewBg(c.bg); setNewText(c.text); }}
                className={cn("w-7 h-7 rounded-full border-2 transition-all", c.bg.replace('/20', ''),
                  newBg === c.bg ? "border-foreground scale-110" : "border-transparent")} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} className="gap-1"><Check className="h-3.5 w-3.5" /> Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 group">
            {editingId === tag.id ? (
              <div className="flex-1 space-y-2">
                <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8" />
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.bg} onClick={() => { setEditBg(c.bg); setEditText(c.text); }}
                      className={cn("w-6 h-6 rounded-full border-2 transition-all", c.bg.replace('/20', ''),
                        editBg === c.bg ? "border-foreground scale-110" : "border-transparent")} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} className="h-7 gap-1"><Check className="h-3 w-3" /> Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7"><X className="h-3 w-3" /></Button>
                </div>
              </div>
            ) : (
              <>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", tag.bgColor, tag.textColor)}>
                  {tag.label}
                </span>
                <div className="flex-1" />
                <Button variant="ghost" size="icon-sm" onClick={() => startEdit(tag)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(tag.id)}
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
