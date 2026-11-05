import { useState } from "react";
import { errorMessage } from "./errors";
import { n8nClient } from "./n8nClient";
import { useAppStore } from "../store/appStore";

export function useOpenN8n() {
  const settings = useAppStore((state) => state.settings);
  const notify = useAppStore((state) => state.notify);
  const [opening, setOpening] = useState(false);

  const open = async () => {
    if (!settings) {
      notify("Primero configurá la URL de n8n.", "info");
      return;
    }

    setOpening(true);
    try {
      await n8nClient.openUrl(settings.baseUrl);
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setOpening(false);
    }
  };

  return { open, opening, available: Boolean(settings) };
}
