import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import AppShell from "./app/components/AppShell";
import { ErrorBoundary } from "./app/components/ErrorBoundary";
import Home from "./app/routes/Home";
import Settings from "./app/routes/Settings";
import Workflows from "./app/routes/Workflows";
import { useAppStore } from "./app/store/appStore";

function App() {
  const view = useAppStore((state) => state.view);
  const init = useAppStore((state) => state.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AppShell>
          {view === "workflows" ? <Workflows /> : view === "settings" ? <Settings /> : <Home />}
        </AppShell>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
