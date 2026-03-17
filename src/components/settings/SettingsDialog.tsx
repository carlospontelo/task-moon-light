import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Tag, FolderOpen, CreditCard, User, Download, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagsSettings } from './TagsSettings';
import { CategoriesSettings } from './CategoriesSettings';
import { PaymentMethodsSettings } from './PaymentMethodsSettings';
import { PreferencesSettings } from './PreferencesSettings';
import { AccountSettings } from './AccountSettings';
import { DataSettings } from './DataSettings';

type SettingsSection = 'tags' | 'categories' | 'payment' | 'preferences' | 'account' | 'data';

const SECTIONS: { key: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { key: 'tags', label: 'Tags de Tarefas', icon: <Tag className="h-4 w-4" /> },
  { key: 'categories', label: 'Categorias Financeiras', icon: <FolderOpen className="h-4 w-4" /> },
  { key: 'payment', label: 'Formas de Pagamento', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'data', label: 'Importar / Exportar', icon: <Download className="h-4 w-4" /> },
  { key: 'preferences', label: 'Preferências', icon: <Sliders className="h-4 w-4" /> },
  { key: 'account', label: 'Conta', icon: <User className="h-4 w-4" /> },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('tags');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurações
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-[450px] max-h-[calc(85vh-80px)]">
          {/* Sidebar */}
          <nav className="w-52 shrink-0 border-r border-border p-2 overflow-y-auto">
            {SECTIONS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                  activeSection === key
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'tags' && <TagsSettings />}
            {activeSection === 'categories' && <CategoriesSettings />}
            {activeSection === 'payment' && <PaymentMethodsSettings />}
            {activeSection === 'data' && <DataSettings />}
            {activeSection === 'preferences' && <PreferencesSettings />}
            {activeSection === 'account' && <AccountSettings />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <Button variant="ghost" size="icon-sm" onClick={onClick} className="text-muted-foreground hover:text-foreground">
      <Settings className="h-5 w-5" />
    </Button>
  );
}
