# Dramamancer

This is the public repo for **Dramamancer**, an AI-powered game engine in the style of a visual novel. Follow the instructions below to run the app locally. All that's needed is an Anthropic API key.

<p align="center">
  <img src="public/dramamancer_anim.gif" alt="Dramamancer animated preview" width="520" />
</p>


## What is Dramamancer?

Dramamancer is an interactive narrative system that bridges authorial intent and audience input with natural language-based interactions powered by large language models (LLMs). Authors describe story settings in natural language and select accompanying images visualizing thse settings. Players then experience these authored stories by inputting character actions in natural language, while the system adaptively generates visually-aligned story texts. LLMs serve as a narrative engine, dynamically incorporating both the authors’ intent and the player’s actions to flexibly generate stories at their intersections. Dramamancer aims to lower the authorial burden of creating interactive narratives while facilitating flexible player responses beyond predefined choices. For more details, see the following papers:

Wang, Tiffany, et al. [Dramamancer: Interactive Narratives with LLM-powered Storylets.](https://dl.acm.org/doi/full/10.1145/3746058.3758995) Adjunct Proceedings of the 38th Annual ACM Symposium on User Interface Software and Technology. 2025.

Wang, Tiffany, et al. [Design Techniques for LLM-Powered Interactive Storytelling: A Case Study of the Dramamancer System.](https://arxiv.org/abs/2601.18785) Wordplay @ EMNLP 2025.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and set your Anthropic API key:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API key:

   ```
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ```

   Get your key at [https://console.anthropic.com/](https://console.anthropic.com/). The API key is required for playing and quickstart-authoring storygames.

   **Optional:** Override the database directory (default: `data`):

   ```
   DATA_DIR=./data
   ```

## Running locally

```bash
npm run dev
```

The app runs at [http://localhost:3001](http://localhost:3001).


## Database

The app uses SQLite for data storage. The database file is automatically created at `data/dramamancer.db` when the app starts. The `data` directory is created if it doesn't exist. To use a different directory, set `DATA_DIR` in `.env` (e.g. `DATA_DIR=./data`).
