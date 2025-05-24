import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProgrammeGenerator from "./pages/ProgrammeGenerator";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import CoachVirtuel from "./pages/CoachVirtuel";
import MonEspace from "./pages/MonEspace";
import Login from "./pages/Login";
import Tarifs from "./pages/Tarifs";
import Success from "./pages/Success"; // Import the new Success page
import Cancel from "./pages/Cancel"; // Import the new Cancel page
import { PopupProvider } from "./contexts/PopupContext";
import { supabase } from "@/integrations/supabase/client";
import { SessionContextProvider, useSession } from '@supabase/auth-helpers-react';

const queryClient = new QueryClient();

// Component to handle authentication redirects
const AuthRedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Add '/tarifs', '/success', '/cancel' to public paths
  const publicPaths = ['/', '/programme', '/blog', '/coach-virtuel', '/tarifs', '/success', '/cancel'];
  // Add dynamic blog post paths to public paths
  const isBlogPost = location.pathname.match(/^\/[^/]+\/[^/]+$/); // Basic regex for /category/post

  if (!publicPaths.includes(location.pathname) && !isBlogPost && !session && location.pathname !== '/login') {
      // If not a public path, not a blog post, not logged in, and not already on the login page, redirect to login
      console.log(`Redirecting to /login from ${location.pathname} (no session)`);
      navigate('/login', { replace: true });
  } else if (session && location.pathname === '/login') {
      // If logged in and on the login page, redirect to home
      console.log(`Redirecting to / from ${location.pathname} (session exists)`);
      navigate('/', { replace: true });
  }


  return <>{children}</>;
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Wrap with SessionContextProvider */}
        <SessionContextProvider supabaseClient={supabase}>
          <PopupProvider>
            {/* Wrap Routes with AuthRedirectHandler */}
            <AuthRedirectHandler>
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
                <Route path="/success" element={<Success />} /> {/* Add Success route */}
                <Route path="/cancel" element={<Cancel />} /> {/* Add Cancel route */}
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthRedirectHandler>
          </PopupProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;