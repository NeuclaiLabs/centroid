# OpenAstra 👋

![GitHub stars](https://img.shields.io/github/stars/openastra/openastra?style=social)
![GitHub forks](https://img.shields.io/github/forks/openastra/openastra?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/openastra/openastra?style=social)
![GitHub repo size](https://img.shields.io/github/repo-size/openastra/openastra)
![GitHub language count](https://img.shields.io/github/languages/count/openastra/openastra)
![GitHub top language](https://img.shields.io/github/languages/top/openastra/openastra)
![GitHub last commit](https://img.shields.io/github/last-commit/openastra/openastra?color=red)
![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fopenastra%2Fopenastra&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)
[![Discord](https://img.shields.io/badge/Discord-OpenAstra-blue?logo=discord&logoColor=white)](https://discord.gg/openastra)
[![](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/openastra)

**OpenAstra is a powerful, extensible, and user-friendly self-hosted AI assistant platform.** It enables seamless interaction with LLMs, API orchestration, and intelligent automation, supporting **OpenAI-compatible APIs, RAG, and advanced function calling**.

For more information, check out the [OpenAstra Documentation](https://docs.openastra.com/).

![OpenAstra Demo](./demo.gif)

## Key Features of OpenAstra ⭐

- 🚀 **Easy Deployment**: Install via Docker, Kubernetes, or Python pip.
- 🤖 **LLM Support**: Integrates with OpenAI-compatible APIs, including GPT-4o-mini.
- 🛠️ **Dynamic API Assistant**: Call APIs with authentication, retries, and dynamic parameters.
- 🔍 **RAG (Retrieval-Augmented Generation)**: Load documents and search locally for improved AI responses.
- 🔐 **User Management & RBAC**: Fine-grained access control with superuser management.
- 📱 **Responsive UI**: Works across desktop, mobile, and PWA.
- 📚 **Markdown & LaTeX Support**: Rich text formatting for better AI interactions.
- 🌍 **Multilingual**: Supports multiple languages with internationalization.
- 🧩 **Plugin & Extensions**: Expand capabilities with a modular plugin framework.
- ⚙️ **Backend API Support**: FastAPI-based backend with built-in authentication.
- 🖼️ **Image Generation**: Integrated DALL-E, ComfyUI, and AUTOMATIC1111 support.

Want more details? Check out our [documentation](https://docs.openastra.com/features)!

## 🚀 Installation Guide

### 1. Install via Python pip 🐍

Ensure **Python 3.11** is installed before proceeding.

```bash
pip install openastra
```

Start the OpenAstra server:

```bash
openastra serve
```

Access it at [http://localhost:8000](http://localhost:8000)

### 2. Quick Start with Docker 🐳

```bash
docker run -d -p 3000:8000 --name openastra --restart always ghcr.io/openastra/openastra:latest
```

### 3. Kubernetes Deployment 🌎

Use `kubectl`, `kustomize`, or `helm` for deployment:

```bash
helm install openastra ./charts/openastra
```

### 4. Running with Nvidia GPU (CUDA Support) 🖥️

```bash
docker run -d -p 3000:8000 --gpus all --name openastra ghcr.io/openastra/openastra:cuda
```

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PROJECT_NAME` | Name of the project | OpenAstra |
| `DOMAIN` | Deployment domain | localhost |
| `LLM_BASE_URL` | LLM service URL | https://api.openai.com/v1 |
| `LLM_DEFAULT_MODEL` | Default model used | gpt-4o-mini |
| `NEXT_PUBLIC_API_URL` | API endpoint | http://localhost:8000 |
| `NEXT_PUBLIC_APP_URL` | Web app URL | http://localhost:3000 |
| `FIRST_SUPERUSER` | Admin email | admin@openastra.com |
| `FIRST_SUPERUSER_PASSWORD` | Admin password | openastra123 |

## 🛠️ Development Setup

1. Clone the repo:

```bash
git clone https://github.com/openastra/openastra.git && cd openastra
```

2. Install dependencies:

```bash
pnpm install  # for frontend
typoetry install  # for backend
```

3. Run the project:

```bash
./start.sh
```

## 🤝 Contributing

We welcome contributions! Feel free to check our [Contributing Guide](https://github.com/openastra/openastra/blob/main/CONTRIBUTING.md) and submit PRs.

## ⭐ Community & Support

- [Join Discord](https://discord.gg/openastra)
- [Submit Issues](https://github.com/openastra/openastra/issues)
- [Read Documentation](https://docs.openastra.com/)

## 📜 License

OpenAstra is licensed under the [MIT License](LICENSE).

---

Built with ❤️ by the OpenAstra community 🚀
