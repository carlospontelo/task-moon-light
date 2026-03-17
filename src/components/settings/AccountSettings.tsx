import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Mail, Shield } from 'lucide-react';

export function AccountSettings() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Conta</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Gerencie sua conta e sessão</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Conta ativa</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border opacity-60">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Alterar senha</p>
            <p className="text-xs text-muted-foreground">Em breve</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <Button variant="outline" onClick={signOut} className="gap-2 text-destructive hover:text-destructive">
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
