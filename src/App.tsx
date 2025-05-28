import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Removed useNavigate, useLocation
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProgrammeGenerator from "./pages/ProgrammeGenerator";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import CoachVirtuel from "./pages/CoachVirtuel";
import MonEspace from "./pages/MonEspace";
import Login from "./pages/Login";
import Tarifs from "./pages/Tarifs";
import Merci1 from "./pages/Merci1"; // Import Merci1
import Merci2 from "./pages/Merci2"; // Import Merci2
import MentionsLegales from "./pages/MentionsLegales"; // Import MentionsLegales
import CGV from "./pages/CGV"; // Import CGV
import { PopupProvider } from "./contexts/PopupContext";
import { supabase } from "@/integrations/supabase/client";
import { SessionContextProvider } from '@supabase/auth-helpers-react'; // Removed useSession

const queryClient = new QueryClient();

// Removed AuthRedirectHandler component entirely

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Wrap with SessionContextProvider */}
        <SessionContextProvider supabaseClient={supabase}>
          <PopupProvider>
            {/* Routes are no longer wrapped by AuthRedirectHandler */}
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/programme" element={<ProgrammeGenerator />} />
              <Route path="/blog" element={<Blog />} />
              {/* Route for individual blog posts */}
              <Route path="/:categorySlug/:postSlug" element={<BlogPostDetail />} />
              <Route path="/coach-virtuel" element={<CoachVirtuel />} />
              <Route path="/mon-espace" element={<MonEspace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/tarifs" element={<Tarifs />} />
              <Route path="/merci1" element={<Merci1 />} /> {/* Add Merci1 route */}
              <Route path="/merci2" element={<Merci2 />} /> {/* Add Merci2 route */}
              <Route path="/mentions-legales" element={<MentionsLegales />} /> {/* Add MentionsLegales route */}
              <Route path="/cgv" element={<CGV />} /> {/* Add CGV route */}
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PopupProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;