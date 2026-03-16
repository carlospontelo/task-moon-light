import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Goal, 
  GoalArea, 
  GoalType, 
  GoalEnergy,
  GOAL_AREA_LABELS,
  GOAL_TYPE_LABELS,
  GOAL_ENERGY_LABELS,
  GOAL_ENERGY_ICONS,
  MAX_ACTIVE_GOALS,
} from '@/types/goal';
import { AlertCircle } from 'lucide-react';

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    title: string,
    area: GoalArea,
    type: GoalType,
    energy: GoalEnergy,
    quarter: string,
    description?: string
  ) => boolean | Promise<boolean>;
  currentQuarter: string;
  activeGoalsCount: number;
  editingGoal?: Goal;
  onUpdate?: (updates: Partial<Pick<Goal, 'title' | 'description' | 'area' | 'type' | 'energy'>>) => void;
}

export function GoalForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  currentQuarter,
  activeGoalsCount,
  editingGoal,
  onUpdate,
}: GoalFormProps) {
  const [title, setTitle] = useState(editingGoal?.title || '');
  const [description, setDescription] = useState(editingGoal?.description || '');
  const [area, setArea] = useState<GoalArea>(editingGoal?.area || 'personal');
  const [type, setType] = useState<GoalType>(editingGoal?.type || 'project');
  const [energy, setEnergy] = useState<GoalEnergy>(editingGoal?.energy || 'medium');
  const [error, setError] = useState('');

  const isEditing = !!editingGoal;
  const canAddMore = activeGoalsCount < MAX_ACTIVE_GOALS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    if (isEditing && onUpdate) {
      onUpdate({
        title: title.trim(),
        description: description.trim() || undefined,
        area,
        type,
        energy,
      });
      onOpenChange(false);
      resetForm();
    } else {
      const result = onSubmit(
        title.trim(),
        area,
        type,
        energy,
        currentQuarter,
        description.trim() || undefined
      );
      
      const success = result instanceof Promise ? await result : result;
      if (success) {
        onOpenChange(false);
        resetForm();
      } else {
        setError(`Limite de ${MAX_ACTIVE_GOALS} metas ativas atingido neste trimestre`);
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setArea('personal');
    setType('project');
    setEnergy('medium');
    setError('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Meta' : 'Nova Meta'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize os detalhes da sua meta estratégica.'
              : 'Defina uma meta estratégica para este trimestre.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && !canAddMore && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Você já tem {MAX_ACTIVE_GOALS} metas ativas. Conclua ou pause uma meta antes de criar outra.</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="Ex: Lançar MVP do produto"
              disabled={!isEditing && !canAddMore}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente o que significa alcançar essa meta..."
              rows={2}
              disabled={!isEditing && !canAddMore}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={area} onValueChange={(v) => setArea(v as GoalArea)} disabled={!isEditing && !canAddMore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_AREA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as GoalType)} disabled={!isEditing && !canAddMore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Energia</Label>
              <Select value={energy} onValueChange={(v) => setEnergy(v as GoalEnergy)} disabled={!isEditing && !canAddMore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_ENERGY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {GOAL_ENERGY_ICONS[key as GoalEnergy]} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isEditing && !canAddMore}>
              {isEditing ? 'Salvar' : 'Criar Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
