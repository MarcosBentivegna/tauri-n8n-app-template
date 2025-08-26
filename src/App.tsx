import { useAppStore } from "./app/store/appStore";
import AppShell from "./app/components/AppShell";
import Home from "./app/routes/Home";
import Workflows from "./app/routes/Workflows";
import Settings from "./app/routes/Settings";

function App() {
  const { activeTab } = useAppStore();

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "workflows":
        return <Workflows />;
      case "settings":
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return <AppShell>{renderContent()}</AppShell>;
}

export default App;
