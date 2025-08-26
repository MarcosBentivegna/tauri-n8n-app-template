import { useState } from "react";
import { motion } from "framer-motion";
import { n8nClient } from "../lib/n8nClient";
import { showToast } from "../lib/ui";

export default function SyncPanel() {
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function testEcho() {
    setLoading(true);
    try {
      const res = await n8nClient.echo({ hello: "world" });
      setOut(res);
      showToast("Echo test successful!", "success");
    } catch (e: any) {
      setOut({ error: String(e) });
      showToast("Echo test failed: " + String(e), "error");
    } finally {
      setLoading(false);
    }
  }

  async function syncContacts() {
    setLoading(true);
    try {
      const res = await n8nClient.syncContacts({ 
        altas: [], 
        bajas: [], 
        updates: [] 
      });
      setOut(res);
      showToast("Contacts sync successful!", "success");
    } catch (e: any) {
      setOut({ error: String(e) });
      showToast("Contacts sync failed: " + String(e), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50"
          onClick={testEcho}
          disabled={loading}
        >
          Probar Webhook Echo
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-50"
          onClick={syncContacts}
          disabled={loading}
        >
          Sincronizar Contactos (demo)
        </motion.button>
      </div>
      <pre className="text-xs bg-gray-900/60 border border-gray-800 p-3 rounded-xl overflow-auto max-h-64">
        {JSON.stringify(out, null, 2)}
      </pre>
    </div>
  );
}
