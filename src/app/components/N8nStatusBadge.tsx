import { useEffect } from "react";
import { motion } from "framer-motion";
import { n8nClient } from "../lib/n8nClient";
import { useAppStore } from "../store/appStore";

export default function N8nStatusBadge() {
  const { n8nStatus, setN8nStatus } = useAppStore();

  useEffect(() => {
    const checkHealth = async () => {
      setN8nStatus("checking");
      try {
        await n8nClient.health();
        setN8nStatus("online");
      } catch {
        setN8nStatus("offline");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [setN8nStatus]);

  const getStatusColor = () => {
    switch (n8nStatus) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      case "checking":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (n8nStatus) {
      case "online":
        return "Online";
      case "offline":
        return "Offline";
      case "checking":
        return "Checking...";
      default:
        return "Unknown";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}
    >
      <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor()}`} />
      {getStatusText()}
    </motion.div>
  );
}
