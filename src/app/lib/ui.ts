import { useAppStore } from "../store/appStore";

export const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
  const addNotification = useAppStore.getState().addNotification;
  addNotification({ type, message });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    const removeNotification = useAppStore.getState().removeNotification;
    const notifications = useAppStore.getState().notifications;
    const lastNotification = notifications[notifications.length - 1];
    if (lastNotification) {
      removeNotification(lastNotification.id);
    }
  }, 5000);
};
