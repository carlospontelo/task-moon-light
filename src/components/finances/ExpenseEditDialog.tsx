import { useState } from 'react';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '@/types/expense';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ExpenseEditDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    expenseId: string,
    data: Partial<Pick<Expense, 'name' | 'amount' | 'category'>>,
    scope: 'this' | 'from_this' | 'all'
  ) => void;
}

export function ExpenseEditDialog({ expense, open, onOpenChange, onSave }: ExpenseEditDialogProps) {
  const [name, setName] = useState(expense?.name || '');
  const [amount, setAmount] = useState(expense ? (expense.amount / 100).toFixed(2).replace('.', ',') : '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'other');
  const [scope, setScope] = useState<'this' | 'from_this' | 'all'>('from_this');

  // Update form when expense changes
  if (expense && name !== expense.name && !open) {
    setName(expense.name);
    setAmount((expense.amount / 100).toFixed(2).replace('.', ','));
    setCategory(expense.category);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    const amountInCents = Math.round(parseFloat(amount.replace(',', '.')) * 100);

    onSave(expense.id, { name, amount: amountInCents, category }, scope);
    onOpenChange(false);
  };

  const showScopeOptions = expense?.type === 'fixed' || expense?.type === 'installment';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da despesa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="edit-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPENSE_CATEGORIES).map(([key, { label, icon }]) => (
                  <SelectItem key={key} value={key}>
                    {icon} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showScopeOptions && (
            <div className="space-y-3">
              <Label>Aplicar alteração em:</Label>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
                {expense?.type === 'fixed' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="from_this" id="from_this" />
                      <Label htmlFor="from_this" className="font-normal cursor-pointer">
                        A partir deste mês
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="font-normal cursor-pointer">
                        Todos os meses
                      </Label>
                    </div>
                  </>
                )}
                {expense?.type === 'installment' && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="from_this" id="from_this" />
                    <Label htmlFor="from_this" className="font-normal cursor-pointer">
                      Esta e próximas parcelas
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
