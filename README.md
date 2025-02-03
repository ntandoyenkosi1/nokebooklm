# NotbookLM - Your Customizable Podcast Generator

NotbookLM is a customizable podcast generator inspired by NotebookLM, allowing you to create AI-powered podcasts from various sources.

## Demo





https://github.com/user-attachments/assets/09be16c5-cd5d-4bc7-9cf5-06946fd02100

https://github.com/user-attachments/assets/ea3e57b8-65f6-4661-90c2-b7d8207f70ab

https://github.com/user-attachments/assets/aa9e2b95-96a7-491d-83ec-ce834e9831c0




## Key Features

* **Customizable Podcast:**  Set the podcast name, speaker names (up to 3), and choose from different speaker voices.
* **Multiple Input Sources:** Add content from PDFs, text files, Markdown, pasted text, and YouTube videos (local development only).
* **Powered by Langchain:**  Leverages Langchain for LLM interaction. ChatGPT-4o-mini is the preferred model.
* **Cloud Deployment:** Deployed on GCP Cloud Run via a Dockerfile. Requires a service account/GCP API Key with **Cloud Text-to-Speech** enabled.
* **Local Development:** Requires environment variables for local setup.

## Known Issues

* **YouTube Videos (in Production):** YouTube video processing is currently not working in the deployed environment. A potential solution involves hosting a separate server locally using `@distube/ytdl-core` to handle this functionality.
* **Inaccurate Audio Time:** The displayed audio time on the frontend may not be perfectly accurate due to the audio stitching process.  However, the audio playback itself functions correctly.

## Installation Instructions (Node.js/Bun)

This project requires Node.js or Bun.  Choose your preferred runtime and follow the corresponding instructions.

### Using Node.js
Set Environment Variables:  Create a `.env` file in the root directory and populate it with the necessary environment variables.
```dotenv
GOOGLE_API_KEY=...
OPENAI_API_KEY=...
```
**Install Dependencies:**
```bash
    npm install # bun install
    npm start   #bun run start
```
