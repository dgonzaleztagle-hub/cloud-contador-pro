import { Mail, ExternalLink } from 'lucide-react';
import nubixLogo from '@/assets/nubix-logo.jpg';

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-gradient-to-b from-card/50 to-background backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <a
              href="mailto:dgonzalez.tagle@gmail.com?subject=Consulta sobre Plus Contable"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-300 group"
            >
              <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>
                Creado por <span className="font-semibold text-foreground">Daniel González</span>
              </span>
            </a>
            <p className="text-xs text-muted-foreground ml-6">
              Idea y asesoría contable: <span className="font-semibold text-foreground">Joel Carvajal</span>
            </p>
          </div>

          {/* Powered by Nubix */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 group">
              <img 
                src={nubixLogo} 
                alt="Nubix Logo" 
                className="h-12 w-12 rounded-lg group-hover:scale-110 transition-transform duration-300 object-contain"
              />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Powered by</p>
                <p className="text-[10px] text-muted-foreground tracking-wider">
                  Code. Cloud. Create.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex justify-center md:justify-end">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Plus Contable. Todos los derechos reservados.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <p className="text-center text-xs text-muted-foreground/70">
            Sistema integral de gestión administrativa, tributaria y recursos humanos
          </p>
        </div>
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
    </footer>
  );
}
