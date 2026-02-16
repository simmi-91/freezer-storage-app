# Freezer Storage App

Testing [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with Team Agents to build a Freezer Storage App.

This project is an experiment in using Claude Code's multi-agent team feature to develop a complete web application. The entire codebase — frontend components, styling, data model, and project planning — was generated through coordinated AI agents (lead, frontend, backend) working from a shared task list.

## What It Does

A simple web app to track what's in your home freezer. You can:

- Add, edit, and remove items with category, quantity, and expiry date
- Search and filter by category
- Sort by name, date added, or expiry date
- See color-coded expiry status (green/yellow/orange/red)
- Reference recommended freezer shelf life by category

## Tech Stack

- **Frontend:** React 19 + TypeScript, built with Vite
- **Package Manager:** pnpm
- **Backend (planned):** Node.js + Express + MySQL

## Current Status

Phase 1 (frontend-only with localStorage) is complete. See [CLAUDE.md](CLAUDE.md) for the full roadmap and decisions log.

## Running Locally

```bash
cd client
pnpm install
pnpm dev
# Opens at http://localhost:5173
```

## About This Experiment

This project was built almost entirely by Claude Code agents. The planning documents in `.planning/` and the coordination rules in `CLAUDE.md` were all part of the multi-agent workflow. It's a test of how well AI agents can collaborate on a real (if small) software project.
