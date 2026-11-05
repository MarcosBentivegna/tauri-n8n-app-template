import { invoke } from "@tauri-apps/api/core";

export const n8nClient = {
  health: () => invoke<string>("n8n_health_check"),
  echo: (payload: unknown) => invoke<unknown>("n8n_trigger_echo", { payload }),
  syncContacts: (payload: unknown) =>
    invoke<unknown>("n8n_trigger_contacts_sync", { payload }),
};
