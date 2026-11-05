# 🚀 Tauri n8n Starter

> A modern desktop application template that integrates Tauri with n8n for local workflow automation

[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![n8n](https://img.shields.io/badge/n8n-Latest-FF6B5B?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

<div align="center">
  <img src="https://img.shields.io/badge/Status-Ready%20to%20Use-brightgreen?style=for-the-badge" alt="Status: Ready to Use"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License: MIT"/>
</div>

---

## ✨ Features

<div align="center">

| 🎨 **Frontend**    | 🖥️ **Desktop**    | ⚡ **Automation** | 🔒 **Security**  |
| ------------------ | ----------------- | ----------------- | ---------------- |
| React + TypeScript | Tauri (Rust)      | n8n + Docker      | Basic Auth       |
| Vite + TailwindCSS | Minimal footprint | Local workflows   | CSP Headers      |
| Framer Motion      | Cross-platform    | Webhook triggers  | Environment vars |

</div>

## 🎯 What You Get

- **🚀 Modern UI**: Beautiful dark theme with smooth animations
- **⚡ Real-time Status**: Live n8n connection monitoring
- **🔧 Ready-to-use**: Pre-configured workflows and examples
- **🛡️ Secure**: Built-in security best practices
- **📱 Cross-platform**: Works on Windows, macOS, and Linux

## 🛠️ Tech Stack

```mermaid
graph TB
    A[Tauri App] --> B[React Frontend]
    A --> C[Rust Backend]
    C --> D[n8n Docker]
    B --> E[TypeScript]
    B --> F[TailwindCSS]
    B --> G[Framer Motion]
    C --> H[reqwest HTTP]
    D --> I[Workflow Engine]
```

## 📋 Prerequisites

- **Node.js** 18+
- **Rust** toolchain
- **Docker** + Docker Compose

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd tauri-n8n-starter

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment variables
cp .env.example .env
```

### 3. Run Development

```bash
# Start n8n + Tauri app
npm run dev
```

This command will:

1. 🐳 Start n8n in Docker (http://localhost:5678)
2. 🖥️ Launch the Tauri desktop application

### 🔑 Default Credentials

| Service | URL                   | Username | Password     |
| ------- | --------------------- | -------- | ------------ |
| **n8n** | http://localhost:5678 | `admin`  | `adminadmin` |

## 📊 Available Scripts

| Command            | Description              |
| ------------------ | ------------------------ |
| `npm run dev`      | 🚀 Start n8n + Tauri app |
| `npm run dev:n8n`  | 🐳 Start only n8n        |
| `npm run stop:n8n` | ⏹️ Stop n8n              |
| `npm run build`    | 📦 Build production app  |
| `npm run lint`     | 🔍 Run ESLint            |
| `npm run format`   | ✨ Format with Prettier  |

## 🔧 n8n Workflows

### 1. Webhook Echo

Create a workflow in n8n with:

```mermaid
graph LR
    A[Webhook] --> B[Function]
    B --> C[Respond]

    A -->|Path: /echo| A
    B -->|Echo JSON| B
    C -->|Return Response| C
```

**Configuration:**

- **Start Node**: Webhook
  - Path: `/echo`
  - Method: POST
- **Function Node**:
  ```javascript
  return [{ json: { ok: true, received: $json } }];
  ```
- **Respond Node**: Body: `{{$json}}`

### 2. Sync Contacts

Create a workflow in n8n with:

```mermaid
graph LR
    A[Webhook] --> B[Function]
    B --> C[Respond]

    A -->|Path: /sync-contacts| A
    B -->|Process Contacts| B
    C -->|Return Summary| C
```

**Configuration:**

- **Start Node**: Webhook
  - Path: `/sync-contacts`
  - Method: POST
- **Function Node**:
  ```javascript
  const { altas = [], bajas = [], updates = [] } = $json;
  return [
    {
      json: {
        ok: true,
        counts: { altas: altas.length, bajas: bajas.length, updates: updates.length },
      },
    },
  ];
  ```
- **Respond Node**: Body: `{{$json}}`

## 📁 Project Structure

```
tauri-n8n-starter/
├─ 🎨 src/                          # Frontend React/TypeScript
│  ├─ app/
│  │  ├─ components/                # React Components
│  │  │  ├─ AppShell.tsx           # Main layout
│  │  │  ├─ N8nStatusBadge.tsx     # Status indicator
│  │  │  └─ SyncPanel.tsx          # Workflow testing
│  │  ├─ lib/                      # Utilities
│  │  │  ├─ n8nClient.ts           # n8n API client
│  │  │  └─ ui.ts                  # UI helpers
│  │  ├─ store/                    # State management
│  │  │  └─ appStore.ts            # Zustand store
│  │  └─ routes/                   # Application pages
│  │     ├─ Home.tsx               # Dashboard
│  │     ├─ Workflows.tsx          # Workflow management
│  │     └─ Settings.tsx           # Configuration
│  ├─ App.tsx                      # Main app component
│  ├─ main.tsx                     # Entry point
│  └─ index.css                    # Global styles
├─ ⚙️ src-tauri/                    # Backend Tauri (Rust)
│  ├─ src/
│  │  ├─ main.rs                   # Tauri commands
│  │  └─ n8n_proxy.rs              # HTTP client for n8n
│  ├─ tauri.conf.json              # Tauri configuration
│  └─ Cargo.toml                   # Rust dependencies
├─ 🐳 docker-compose.yml            # n8n configuration
├─ 🔐 .env                         # Environment variables
└─ 📖 README.md                    # This file
```

## 🛡️ Security Features

- **🔐 Credential Management**: Handled securely in Rust backend
- **🛡️ CSP Headers**: Restrictive Content Security Policy
- **🔒 Basic Auth**: n8n authentication enabled
- **🌍 Environment Variables**: Secure configuration management
- **📋 Allowlist**: Minimal Tauri permissions

## 🎨 UI Preview

<div align="center">

### 🏠 Home Dashboard

![Home Dashboard](https://via.placeholder.com/800x400/1f2937/ffffff?text=Home+Dashboard)

### ⚡ Workflows Panel

![Workflows Panel](https://via.placeholder.com/800x400/1f2937/ffffff?text=Workflows+Panel)

### ⚙️ Settings Page

![Settings Page](https://via.placeholder.com/800x400/1f2937/ffffff?text=Settings+Page)

</div>

## 📖 Documentation

- **[📋 Usage Instructions (English)](INSTRUCTIONS.md)** - Complete setup and usage guide
- **[📋 Instrucciones de Uso (Español)](INSTRUCCIONES.md)** - Guía completa de configuración y uso

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - For the amazing desktop framework
- [n8n](https://n8n.io/) - For the powerful workflow automation
- [React](https://reactjs.org/) - For the frontend framework
- [TailwindCSS](https://tailwindcss.com/) - For the utility-first CSS

---

<div align="center">

**Made with ❤️ for the automation community**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/tauri-n8n-starter?style=social)](https://github.com/yourusername/tauri-n8n-starter)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/tauri-n8n-starter?style=social)](https://github.com/yourusername/tauri-n8n-starter)

</div>
