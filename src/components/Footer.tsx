import { Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm py-4 mt-auto">
      <div className="container mx-auto px-6">
        <a
          href="mailto:dgonzalez.tagle@gmail.com?subject=Consulta sobre Plus Contable"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
        >
          <Mail className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
          <span>App creada por <span className="font-semibold text-foreground">Daniel González</span></span>
        </a>
      </div>
    </footer>
  );
}
