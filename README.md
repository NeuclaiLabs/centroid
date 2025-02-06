<div align="center">
  <h1>🚀 OpenAstra</h1>
  <p>
    <strong>A chat-based API development platform that makes API workflows intuitive and powerful.</strong>
  </p>

  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/>
  <img src="https://img.shields.io/github/v/release/srikanth235/openastra" alt="GitHub Release"/>
  <img src="https://img.shields.io/github/issues/srikanth235/openastra" alt="GitHub Issues"/>
  <img src="https://img.shields.io/github/stars/srikanth235/openastra" alt="GitHub Stars"/>
  <a href="https://twitter.com/openastradev" style="text-decoration: none; outline: none">
    <img src="https://img.shields.io/twitter/url/https/twitter.com/openastradev.svg?style=social&label=%20%40openastradev" alt="Twitter: @openastradev"/>
  </a>
  <a href="https://discord.gg/openastra" style="text-decoration: none; outline: none">
    <img src="https://dcbadge.vercel.app/api/server/openastra?style=flat&compact=true" alt="Discord"/>
  </a>

  <br/>
  <br/>
  <img src="./demo.gif" alt="OpenAstra Demo" width="600">
</div>

## 🎯 Overview

OpenAstra re-imagines API workflows through the power of natural conversation. Think of it as "Postman meets ChatGPT" - a modern, intuitive approach to API interaction that lets you:

- **Chat With Your APIs**: Instead of building complex request configurations, simply describe what you want to do in natural language
- **Intelligent API Discovery**: Let AI help you explore and understand API endpoints through conversation
- **Context-Aware Interactions**: The system remembers your previous API calls and authentication context
- **Run API endpoints**: Execute API endpoints directly from the UI
- **Automated Testing**: Generate and run API tests using natural language descriptions (in roadmap)
- **Smart Documentation**: Auto-generate and update API documentation from your conversations (in roadmap)

## ✨ Features

- **🤖 Advanced LLM Integration**

  - OpenAI-compatible API support
  - GPT-4o-mini compatibility
  - Function calling capabilities

- **🔍 RAG & Search**

  - Document indexing and search
  - Context-aware responses
  - Local knowledge base

- **🛠️ Developer Experience**

  - FastAPI backend
  - Next.js frontend
  - Docker & Kubernetes ready
  - Extensive API documentation

- **🔐 Enterprise Ready**

  - Role-based access control
  - User management
  - API authentication
  - Audit logging

- **🎨 Rich Features**
  - Markdown & LaTeX support
  - Image generation (DALL-E, ComfyUI)
  - Multilingual support
  - Plugin system
  - Mobile-responsive UI

## 🚀 Quick Start

### Using Docker

> [!INFO]
> When using Docker to install OpenAstra, you **must** include the volume mount `-v openastra_data:/app/data` in your Docker command. This is not optional - it's crucial for:
>
> - Persisting your database
> - Preventing data loss between container restarts
> - Maintaining your chat history and configurations
>
> Without the volume mount, all data will be lost when the container is restarted or updated.

Visit `http://localhost:3000` to access the web interface and `http://localhost:8000` for the API.

```bash
docker run -d \
  -p 3000:3000 \
  -v openastra_data:/app/data \
  -e LLM_API_KEY=your_api_key \
  --name openastra \
  --restart always \
  ghcr.io/srikanth235/openastra:latest
```


### Environment Variables

```bash
# LLM Configuration
LLM_BASE_URL=https://api.openai.com/v1      # OpenAI API compatible custom endpoint
LLM_API_KEY=your_api_key                    # Your OpenAI compatible API key
LLM_DEFAULT_MODEL=gpt-4o-mini              # Default model to use

# Authentication (Optional)
FIRST_SUPERUSER=admin@example.com          # Default: admin@example.com
FIRST_SUPERUSER_PASSWORD=example123        # Default: example123
```

[View all configuration options →](https://docs.openastra.com/configuration)

## 💻 Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/openastra/openastra.git
   cd openastra
   ```

2. **Install dependencies**

   ```bash
   # Frontend
   pnpm install

   # Backend
   poetry install
   ```

3. **Start development servers**
   ```bash
   ./start.sh
   ```

## 🐳 Docker Deployment Options

### Standard Deployment

```bash
docker run -d -p 3000:3000 openastra/openastra:latest
```

## 🌟 Contributing

We love contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Read our [Contributing Guide](CONTRIBUTING.md) for more details.

## 🤝 Community & Support

- [Discord Community](https://discord.gg/openastra)
- [Documentation](https://docs.openastra.com)
- [GitHub Issues](https://github.com/openastra/openastra/issues)
- [Feature Requests](https://github.com/openastra/openastra/discussions)

## 📄 License

OpenAstra is [MIT licensed](LICENSE).

## 📊 Telemetry

OpenAstra includes optional telemetry to help improve the platform. This feature:

- Is **enabled by default** and requires explicit opt-out
- Only tracks API usage patterns, never sensitive data
- Helps us understand how features are used and identify performance issues

### What We Track

When enabled, OpenAstra tracks:

- Chat API interactions (create/update/delete operations)
- Basic request metrics (duration, status codes)
- Anonymous usage patterns
- Performance indicators

### Configuration

Control telemetry through environment variables:

```bash
# Enable/disable telemetry
TELEMETRY_ENABLED=false
```

### Privacy Considerations

- No personal data or chat content is ever collected
- All tracking is anonymous
- Performance metrics are aggregated
- You can self-host without any external analytics

[Learn more about our privacy policy →](https://docs.openastra.com/privacy)

## 🤖 Choosing an LLM

> [!IMPORTANT]
> OpenAstra requires an LLM with function/tool calling capabilities to work properly.

### Recommended Models

We've tested various LLMs, and these models work particularly well with OpenAstra:

- **GPT-4o-mini**: Excellent performance with API interactions, good balance of cost, speed and accuracy
- **Claude Haiku**: Fast responses, strong understanding of API concepts
- **Llama 3.2 (70B)**: Excellent performance with API interactions, good balance of speed and accuracy

All the above models work equally well with OpenAstra

> [!TIP]
> Any model with similar or better capabilities than above will work well with OpenAstra. The key requirement is support for function/tool calling and a reasonable context window.

> [!WARNING]
> While models without tool calling might partially work, you won't get the full capabilities of OpenAstra's API automation features.

### Performance Considerations

- **Response Time**: Models like Haiku and GPT-4o-mini offer the best latency
- **Cost**: Consider using GPT-4o-mini or Haiku for development/testing
- **Context Window**: Larger context windows help with complex API documentation and multi-step workflows

---

<p align="center">
  Made with ❤️ by humans and AI
  <br>
</p>
