import { Expense } from '@/types/expense';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface ExpenseDeleteDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (expenseId: string, scope: 'this' | 'from_this' | 'all') => void;
}

export function ExpenseDeleteDialog({ expense, open, onOpenChange, onConfirm }: ExpenseDeleteDialogProps) {
  const [scope, setScope] = useState<'this' | 'from_this' | 'all'>('from_this');

  if (!expense) return null;

  const showScopeOptions = expense.type === 'fixed' || expense.type === 'installment';

  const handleConfirm = () => {
    onConfirm(expense.id, expense.type === 'single' ? 'this' : scope);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir despesa</AlertDialogTitle>
          <AlertDialogDescription>
            {expense.type === 'single' 
              ? `Tem certeza que deseja excluir "${expense.name}"?`
              : `Como deseja excluir "${expense.name}"?`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showScopeOptions && (
          <div className="py-4">
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
              {expense.type === 'fixed' && (
                <>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="from_this" id="delete_from_this" />
                    <Label htmlFor="delete_from_this" className="font-normal cursor-pointer">
                      A partir deste mês
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="delete_all" />
                    <Label htmlFor="delete_all" className="font-normal cursor-pointer">
                      Todos os meses (incluindo histórico)
                    </Label>
                  </div>
                </>
              )}
              {expense.type === 'installment' && (
                <>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="from_this" id="delete_from_this" />
                    <Label htmlFor="delete_from_this" className="font-normal cursor-pointer">
                      Esta e próximas parcelas
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 ml-6">
                    Parcelas passadas serão mantidas no histórico
                  </p>
                </>
              )}
            </RadioGroup>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
