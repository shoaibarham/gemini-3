import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ChildDashboard from "@/pages/child-dashboard";
import ParentDashboard from "@/pages/parent-dashboard";
import Reading from "@/pages/reading";
import Math from "@/pages/math";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/child" component={ChildDashboard} />
      <Route path="/parent" component={ParentDashboard} />
      <Route path="/reading" component={Reading} />
      <Route path="/math" component={Math} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="learnbuddy-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
