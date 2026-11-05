import { motion } from "framer-motion";
import SyncPanel from "../components/SyncPanel";

export default function Workflows() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Workflows de n8n</h1>
        <p className="text-gray-300 mb-8">
          Ejecuta y prueba tus flujos de trabajo de n8n desde la aplicación.
        </p>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pruebas de Integración</h2>
          <p className="text-gray-400 mb-6">
            Utiliza estos botones para probar la integración con n8n. Asegúrate de que n8n esté
            ejecutándose y que hayas creado los workflows correspondientes.
          </p>

          <SyncPanel />
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Workflows Requeridos</h2>
          <div className="space-y-4">
            <div className="border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Webhook Echo</h3>
              <p className="text-gray-400 mb-2">
                Endpoint: <code className="bg-gray-900 px-2 py-1 rounded">/webhook/echo</code>
              </p>
              <p className="text-sm text-gray-500">
                Responde con el JSON recibido. Útil para pruebas de conectividad.
              </p>
            </div>

            <div className="border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Sync Contacts</h3>
              <p className="text-gray-400 mb-2">
                Endpoint:{" "}
                <code className="bg-gray-900 px-2 py-1 rounded">/webhook/sync-contacts</code>
              </p>
              <p className="text-sm text-gray-500">
                Procesa sincronización de contactos. Simula integración con WhatsApp Business.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
