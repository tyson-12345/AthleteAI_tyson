import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage from "@/app/page";
import DashboardPage from "@/app/dashboard/page";
import OnboardingPage from "@/app/onboarding/page";
import ProgressPage from "@/app/progress/page";
import ComparePage from "@/app/compare/page";
import ChatPage from "@/app/chat/page";
import AnalysisPage from "@/app/analysis/[id]/page";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/compare" component={ComparePage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/analysis/:id" component={AnalysisPage} />
      <Route>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Page not found</h1>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
