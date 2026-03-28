import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import ProblemDetails from "./pages/ProblemDetails";
import Saved from "./pages/Saved";
import Following from "./pages/Following";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Contribute from "./pages/Contribute";
import AddSolution from "./pages/AddSolution";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/problem/:id/add-solution" element={<AddSolution />} />
          <Route path="/problem/:id" element={<ProblemDetails />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/following" element={<Following />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/contribute" element={<Contribute />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
