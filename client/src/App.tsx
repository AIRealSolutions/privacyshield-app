import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import ScanResults from "./pages/ScanResults";
import RemovalStatus from "./pages/RemovalStatus";
import BreachAlerts from "./pages/BreachAlerts";
import LlmAssistant from "./pages/LlmAssistant";
import ProfileSetup from "./pages/ProfileSetup";
import Monitoring from "./pages/Monitoring";
import DeindexTracker from "./pages/DeindexTracker";
import BrokerCatalog from "./pages/BrokerCatalog";
import AdminPanel from "./pages/AdminPanel";
import Subscription from "./pages/Subscription";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile/setup" component={ProfileSetup} />
      <Route path="/scan/:profileId" component={ScanResults} />
      <Route path="/removal/:profileId" component={RemovalStatus} />
      <Route path="/breach-alerts" component={BreachAlerts} />
      <Route path="/llm-assistant" component={LlmAssistant} />
      <Route path="/monitoring/:profileId" component={Monitoring} />
      <Route path="/deindex/:profileId" component={DeindexTracker} />
      <Route path="/brokers" component={BrokerCatalog} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
