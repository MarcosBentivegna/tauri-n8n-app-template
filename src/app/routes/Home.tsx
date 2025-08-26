import { motion } from "framer-motion";
import N8nStatusBadge from "../components/N8nStatusBadge";

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <h1 className="text-4xl font-bold mb-6">Bienvenido a Tauri n8n Starter</h1>
      <p className="text-xl text-gray-300 mb-8">
        Una aplicación de escritorio que integra Tauri con n8n para automatizaciones locales.
      </p>
      
      <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-lg font-semibold mb-4">Estado del Sistema</h2>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-gray-400">n8n:</span>
          <N8nStatusBadge />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-800 p-6 rounded-lg"
        >
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="text-lg font-semibold mb-2">Workflows</h3>
          <p className="text-gray-400">
            Ejecuta y gestiona tus flujos de trabajo de n8n desde la aplicación.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-800 p-6 rounded-lg"
        >
          <div className="text-3xl mb-2">🔗</div>
          <h3 className="text-lg font-semibold mb-2">Integración</h3>
          <p className="text-gray-400">
            Conecta con n8n a través de comandos Tauri seguros y eficientes.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-800 p-6 rounded-lg"
        >
          <div className="text-3xl mb-2">⚙️</div>
          <h3 className="text-lg font-semibold mb-2">Configuración</h3>
          <p className="text-gray-400">
            Personaliza la configuración de n8n y la aplicación según tus necesidades.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
