# Zyflow

Zyflow is a workflow automation platform that integrates with Google Drive, Zoom, Slack, Discord, Notion, and Email to automate your workflow tasks.

## Features

- 🔄 **Automated Workflows:** Create custom workflows with drag-and-drop interface
- 📁 **Google Drive Integration:** Automatically process files uploaded to Google Drive
- 🎥 **Zoom Integration:** Automatically transcribe and summarize Zoom meetings
- 💬 **Multi-Channel Notifications:** Send notifications via Slack, Discord, Email, or Notion
- ⏱️ **Wait Steps:** Add delays to workflows with automatic cron job management
- 🔐 **Secure Authentication:** Powered by Clerk

## Getting Started

### Development

First, install dependencies:

```bash
npm install
```

Set up your environment variables (see [DEPLOYMENT.md](./DEPLOYMENT.md) for full list):

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

Run database migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Required Cron Jobs

For full automation, you need to set up cron jobs using **cron-job.org** (free). See [CRONJOBS_SETUP.md](./CRONJOBS_SETUP.md) for detailed step-by-step instructions.

**Quick Setup:**
1. Sign up for [cron-job.org](https://cron-job.org) (free)
2. Get API key from cron-job.org → API section
3. Add `CRON_JOB_KEY` to your environment variables
4. Create a cron job to call `/api/cron/refresh-drive-listener` every 6 days
5. Set `CRON_SECRET` and `NEXT_PUBLIC_APP_URL` environment variables

**Note:** Workflow "Wait" steps are automatically handled - no manual setup needed!

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [CRONJOBS_SETUP.md](./CRONJOBS_SETUP.md) - Cron jobs setup guide

## Tech Stack

- **Framework:** Next.js 15
- **Database:** PostgreSQL with Prisma
- **Authentication:** Clerk
- **UI:** React, Tailwind CSS, Radix UI
- **Workflows:** Custom flow builder with React Flow

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
