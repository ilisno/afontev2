import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProgrammeGenerator from "./pages/ProgrammeGenerator";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import CoachVirtuel from "./pages/CoachVirtuel";
import MonEspace from "./pages/MonEspace";
import Login from "./pages/Login";
import Tarifs from "./pages/Tarifs"; // Now points to the content that was in TarifTest.tsx
import TarifsTest from "./pages/TarifTest"; // Now points to the content that was in Tarifs.tsx
import Merci1 from "./pages/Merci1";
import Merci2 from "./pages/Merci2";
import MentionsLegales from "./pages/MentionsLegales";
import CGV from "./pages/CGV";
import Confidentialite from "./pages/Confidentialite";
import APropos from "./pages/APropos";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import { PopupProvider } from "./contexts/PopupContext";
import { supabase } from "@/integrations/supabase/client";
import { SessionContextProvider } from '@supabase/auth-helpers-react';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider supabaseClient={supabase}>
          <PopupProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/programme" element={<ProgrammeGenerator />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/:categorySlug/:postSlug" element={<BlogPostDetail />} />
              <Route path="/coach-virtuel" element={<CoachVirtuel />} />
              <Route path="/mon-espace" element={<MonEspace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/tarifs" element={<Tarifs />} /> {/* This route now uses the content from the original TarifTest.tsx */}
              <Route path="/tariftest" element={<TarifsTest />} /> {/* This route now uses the content from the original Tarifs.tsx */}
              <Route path="/merci1" element={<Merci1 />} />
              <Route path="/merci2" element={<Merci2 />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/cgv" element={<CGV />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="/a-propos" element={<APropos />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PopupProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;