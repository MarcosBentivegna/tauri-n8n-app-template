import { motion } from "framer-motion";
import { useState } from "react";

export default function Settings() {
  const [n8nUrl, setN8nUrl] = useState("http://localhost:5678");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Configuración</h1>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Configuración de n8n</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL de n8n</label>
                <input
                  type="text"
                  value={n8nUrl}
                  onChange={(e) => setN8nUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="http://localhost:5678"
                />
                <p className="text-sm text-gray-500 mt-1">URL base de tu instancia de n8n</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Información del Sistema</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Versión de la App:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Entorno:</span>
                <span>Development</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tauri:</span>
                <span>2.0.0</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Acciones</h2>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reiniciar n8n (Docker)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Abrir n8n en el navegador
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
