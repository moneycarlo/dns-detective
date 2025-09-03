import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import DkimLookup from "./pages/DkimLookup";
import IpAggregator from "./pages/IpAggregator";
import TextManipulations from "./pages/TextManipulations";
import HiddenCharacters from "./pages/HiddenCharacters";
import HtmlFormatter from "./pages/HtmlFormatter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dkim-lookup" element={<DkimLookup />} />
            <Route path="/ip-aggregator" element={<IpAggregator />} />
            <Route path="/text-manipulations" element={<TextManipulations />} />
            <Route path="/hidden-characters" element={<HiddenCharacters />} />
            <Route path="/html-formatter" element={<HtmlFormatter />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
