import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MasterSignup from "./pages/MasterSignup";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import ClientWorkspace from "./pages/ClientWorkspace";
import AdminUsers from "./pages/AdminUsers";
import F29Declarations from "./pages/F29Declarations";
import RRHH from "./pages/RRHH";
import Documents from "./pages/Documents";
import Honorarios from "./pages/Honorarios";
import WorkerRegistration from "./pages/WorkerRegistration";
import CotizacionesPrevisionales from "./pages/CotizacionesPrevisionales";
import F22Declarations from "./pages/F22Declarations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/master" element={<MasterSignup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientWorkspace />} />
            <Route path="/clients/:id/edit" element={<ClientDetails />} />
            <Route path="/f29" element={<F29Declarations />} />
            <Route path="/rrhh" element={<RRHH />} />
            <Route path="/honorarios" element={<Honorarios />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/cotizaciones-previsionales" element={<CotizacionesPrevisionales />} />
            <Route path="/f22" element={<F22Declarations />} />
            <Route path="/registro-trabajador/:token" element={<WorkerRegistration />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
