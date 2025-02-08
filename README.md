<div align="center">
  <h1>🚀 OpenAstra</h1>
  <p>
    <strong>A chat-based open source development platform for API discovery and testing.</strong>
  </p>

  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/>
  <img src="https://img.shields.io/github/v/release/srikanth235/openastra" alt="GitHub Release"/>
  <img src="https://img.shields.io/github/issues/srikanth235/openastra" alt="GitHub Issues"/>
  <img src="https://img.shields.io/github/stars/srikanth235/openastra" alt="GitHub Stars"/>
  <a href="https://twitter.com/openastradev" style="text-decoration: none; outline: none">
    <img src="https://img.shields.io/twitter/url/https/twitter.com/openastradev.svg?style=social&label=%20%40openastradev" alt="Twitter: @openastradev"/>
  </a>
  <a href="https://discord.gg/CNWq2PxX8V" style="text-decoration: none; outline: none">
    <img src="https://dcbadge.vercel.app/api/server/CNWq2PxX8V?style=flat&compact=true" alt="Discord"/>
  </a>

  <br/>
  <br/>
  <img src="./demo.gif" alt="OpenAstra Demo" width="600">
</div>

## ✨ Key Features

OpenAstra re-imagines API workflows through the power of natural conversation. Think of it as "Postman meets ChatGPT" - a modern, intuitive approach to API interaction that lets you:

- 💬 **Chat with API Collections**: Import and interact with your APIs through natural conversation

  - Support for OpenAPI/Swagger specifications
  - Import Postman collections
  - Understand and explore API endpoints through chat

- 🚀 **Execute API Endpoints**: Test and run API endpoints directly from the chat interface

  - Send requests with custom parameters
  - View response data in real-time
  - Save and reuse API configurations

- 🤖 **Flexible LLM Support**: Works with any OpenAI-compatible API
  - Use OpenAI, Azure OpenAI, or any compatible endpoint
  - Support for various models (GPT-4, Claude, Llama)
  - Configurable model settings

## 🚀 Quick Start

### Using Docker

> [!TIP]
> Please include the volume mount `-v openastra_data:/app/data` in your Docker command. It's **crucial** for persisting your database, preventing data loss between container restarts.

Visit `http://localhost:3000` to access the web interface.

```bash
docker run -d \
  -p 3000:3000 \
  -v openastra_data:/app/data \
  -e LLM_BASE_URL=https://api.openai.com/v1 \
  -e LLM_API_KEY=your_api_key \
  -e LLM_DEFAULT_MODEL=gpt-4o-mini \
  -e FIRST_SUPERUSER=admin@example.com \
  -e FIRST_SUPERUSER_PASSWORD=example123 \
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

# Authentication
FIRST_SUPERUSER=admin@example.com          # Default: admin@example.com
FIRST_SUPERUSER_PASSWORD=example123        # Default: example123
```

[View all environment variables →](https://github.com/srikanth235/openastra/blob/main/Dockerfile)

## 🤖 Choosing an LLM

OpenAstra requires an LLM with function/tool calling capabilities. We recommend using any of these tested models:

- **GPT-4o-mini**
- **Claude Haiku**
- **Llama 3.2 (70B)**

Any model with function/tool calling support and a reasonable context window will work well with OpenAstra. Models without tool calling capabilities may have limited functionality.

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

> [!NOTE]
> You can view the exact events we track in our [analytics implementation](https://github.com/srikanth235/openastra/blob/main/backend/app/analytics.py).

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

## 🌟 Contributing

We love contributions! Here's how to get started:

### Development Setup

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

### Making Changes

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🤝 Support & Community

Need help? Join our community:

- [Discord Community](https://discord.gg/CNWq2PxX8V) - Get help and discuss features
- [GitHub Issues](https://github.com/openastra/openastra/issues) - Report bugs
- [Documentation](https://docs.openastra.com) - Learn more about OpenAstra

## 📄 License

OpenAstra is [MIT licensed](LICENSE).

---

<p align="center">
  Made with ❤️ by humans and AI
  <br>
</p>
