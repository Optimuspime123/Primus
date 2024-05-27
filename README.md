# Primus

Telegram Business bot running on Cloudflare Workers (WIP)

## Features

- AI-powered chatbot using Llama-3-70b model from Groq.com
- Context-aware conversations
- Random quote generation
- Random image retrieval from NASA's image gallery
- Random sticker sending
- Random animated emoji sending
- AI-generated images using Stable Diffusion XL Lightning
- Wikipedia article summarization
- Customizable system prompts for AI model
- Custom Inline keyboard button generations with URLs

## Usage

### Commands

- `/ask {query}`: Get a response from the Llama-3-70b model (with context support)
- `/quote`: Get a random quote
- `/img` or `image` (or `/img protect`): Get a random image from the NASA image gallery
- `/sticker` or `sticker` (or `/sticker protect`): Get a random sticker
- `/random` or `random` (or `/random protect`): Get a random animated emoji
- `/gen {prompt}` or `generate... {prompt}`: Generate an image using AI
- `/wiki {query}`: Summarize a Wikipedia article
- `/url`: Send a message with inline keyboard buttons for URLs (photoUrl is optional)
  ```
  /url [message text] [photoUrl]
  button_text - button_url
  ```
- `/set {system prompt}`: Set a custom system prompt for the AI model (can be used on @thebotthatsucks_bot) (applies to the sender only use /clear to clear it)
- `/correct {text}`: Correct and rewrite text using the Grammarly API
- `/clear`: Clear the conversation history and custom system prompt.

## API Keys

To run this bot, you'll need the following API keys:

- **Cloudflare**: Get your API key from the Cloudflare dashboard and ACCOUNT ID
- **Telegram Bot Token**: Create a new bot using [@BotFather](https://t.me/BotFather) on Telegram and obtain the bot token
- **Groq API Key**: Sign up on [Groq.com](https://www.groq.com/) and get your API key
- **NASA API Key**: Get your API key from the [NASA API website](https://api.nasa.gov/)

Make sure to replace the placeholders `BOT_TOKEN` and `API_KEY` in the code with your actual API keys.

## Usage
Copy the contents of worker.js (Or modify them) and paste in the [cloudfare workers dashboard](https://dash.cloudflare.com/) 

## Contributing
uh do stuff if you want to idc
