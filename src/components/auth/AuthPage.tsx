import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { brand } from '@/config/brand';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AuthPageProps {
  hasLocalData: boolean;
  onAuthSuccess: (isNewAccount: boolean) => void;
}

export function AuthPage({ hasLocalData, onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(hasLocalData ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await signUp(email, password);
      if (error) {
        toast({ title: 'Erro ao criar conta', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      toast({ title: 'Conta criada com sucesso!' });
      onAuthSuccess(true);
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Erro ao entrar', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      onAuthSuccess(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-5">
            <div aria-hidden className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
              {brand.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{brand.name}</h1>
          <p className="text-sm text-muted-foreground">{brand.tagline}</p>
        </div>

        {/* Local data notice */}
        {hasLocalData && mode === 'signup' && (
          <div className="rounded-xl p-4 border border-border bg-primary-soft space-y-2">
            <p className="text-sm font-medium text-primary-soft-foreground">📦 Dados encontrados neste dispositivo</p>
            <p className="text-xs text-muted-foreground">
              Crie uma conta para salvar suas tarefas, metas e despesas na nuvem e acessá-las de qualquer computador.
              Seus dados serão migrados automaticamente após o cadastro.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-xl p-6 space-y-4 border border-border bg-card">
          <h2 className="text-lg font-medium text-foreground">
            {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Criar conta
              </>
            )}
          </Button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-primary hover:underline font-medium"
          >
            {mode === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
}
