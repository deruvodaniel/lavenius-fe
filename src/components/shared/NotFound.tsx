import { useNavigate } from 'react-router-dom';
import { Home, Mail, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Illustration */}
        <div className="relative mb-8">
          {/* Big 404 */}
          <div className="text-[150px] sm:text-[180px] font-black text-indigo-100 leading-none select-none">
            404
          </div>
          
          {/* Floating elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Search icon with question mark */}
              <div className="w-24 h-24 bg-card rounded-2xl shadow-xl flex items-center justify-center transform -rotate-6 border-2 border-indigo-100">
                <Search className="w-12 h-12 text-indigo-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                ?
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Pagina no encontrada
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Lo sentimos, la pagina que buscas no existe o fue movida. 
          Verifica la URL o vuelve al inicio.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver atras
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al inicio
          </Button>
        </div>

        {/* Support section */}
        <div className="bg-background/60 backdrop-blur-sm rounded-xl border border-border p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Si el problema persiste, contacta a soporte tecnico:
          </p>
          <a 
            href="mailto:soporte@lavenius.com"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            soporte@lavenius.com
          </a>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-muted-foreground">
          Lavenius - Gestion de Pacientes
        </p>
      </div>
    </div>
  );
}
