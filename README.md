# 🚀 Zyflow - Workflow Automation Platform

A scalable automation platform enabling users to visually design multi-step workflows integrating **Slack, Notion, Discord, Google Drive, and Zoom**. Built with Next.js 15, TypeScript, and modern web technologies.

## ✨ Key Features

### 🎨 Visual Workflow Builder
- **ReactFlow-based drag-and-drop interface** with 13+ node types
- Interactive visual editor with real-time preview
- Support for complex workflows with conditional logic
- Node types include: Triggers, Actions, AI operations, Email, Zoom, Slack, Discord, Notion, Google Drive, Google Calendar, Custom Webhooks, and Wait timers

### 🎥 AI-Powered Zoom Integration
- **Automatic meeting recording processing** with real-time webhook detection
- **OpenAI Whisper transcription** for accurate audio-to-text conversion
- **ChatGPT-powered intelligent summaries** of meeting content
- **Seamless Google Drive integration** for automated storage and organization
- **Configurable daily budgets** for cost-effective transcription
- Complete automation: Detection → Transcription → AI Summary → Cloud Storage → Notifications

### ⚡ Real-time Sync & Webhooks
- Webhook-driven architecture for instant synchronization across platforms
- Real-time event processing and notifications
- Support for 20+ concurrent users with minimal latency

### 🔐 Secure & Scalable
- **Clerk Auth** for enterprise-grade authentication
- **Prisma ORM** with PostgreSQL for robust data management
- Credit-based pricing model (Free tier: 3 automations, 100 tasks/month)

## 🛠️ Technology Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Radix UI, ReactFlow
- **Backend:** Prisma ORM, PostgreSQL, Next.js API Routes
- **Authentication:** Clerk Auth
- **State Management:** Zustand, React Context
- **Integrations:** OpenAI API, Google Drive API, Zoom API, Slack API, Discord API, Notion API
- **Cloud Storage:** Uploadcare
- **Deployment:** Vercel

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
