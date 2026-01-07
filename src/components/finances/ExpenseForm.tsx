import { useState } from 'react';
import { ExpenseType, ExpenseCategory, EXPENSE_CATEGORIES } from '@/types/expense';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { RepeatIcon, CreditCard, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    category: ExpenseCategory;
    type: ExpenseType;
    installmentTotal?: number;
  }) => void;
}

export function ExpenseForm({ open, onOpenChange, onSubmit }: ExpenseFormProps) {
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [selectedType, setSelectedType] = useState<ExpenseType | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [installmentTotal, setInstallmentTotal] = useState('12');

  const resetForm = () => {
    setStep('type');
    setSelectedType(null);
    setName('');
    setAmount('');
    setCategory('other');
    setInstallmentTotal('12');
  };

  const handleTypeSelect = (type: ExpenseType) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !name || !amount) return;

    const amountInCents = Math.round(parseFloat(amount.replace(',', '.')) * 100);

    onSubmit({
      name,
      amount: amountInCents,
      category,
      type: selectedType,
      installmentTotal: selectedType === 'installment' ? parseInt(installmentTotal) : undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const typeOptions = [
    {
      type: 'fixed' as ExpenseType,
      label: 'Despesa Fixa',
      description: 'Repete todo mês automaticamente',
      icon: RepeatIcon,
    },
    {
      type: 'installment' as ExpenseType,
      label: 'Parcelamento',
      description: 'Divide em várias parcelas',
      icon: CreditCard,
    },
    {
      type: 'single' as ExpenseType,
      label: 'Despesa Única',
      description: 'Apenas este mês',
      icon: Receipt,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'type' ? 'Nova Despesa' : `Nova ${typeOptions.find(t => t.type === selectedType)?.label}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' 
              ? 'Escolha o tipo de despesa para começar'
              : 'Preencha os detalhes da despesa'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'type' ? (
          <div className="grid gap-3 py-4">
            {typeOptions.map(({ type, label, description, icon: Icon }) => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 border-transparent",
                  "bg-secondary/50 hover:bg-secondary hover:border-primary/20 transition-all text-left"
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Aluguel, Netflix, Uber..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                {selectedType === 'installment' ? 'Valor da parcela' : 'Valor'}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {selectedType === 'installment' && (
              <div className="space-y-2">
                <Label htmlFor="installments">Número de parcelas</Label>
                <Select value={installmentTotal} onValueChange={setInstallmentTotal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
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

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('type')}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button type="submit" className="flex-1">
                Adicionar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
