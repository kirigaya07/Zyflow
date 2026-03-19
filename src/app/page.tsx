import { HeroParallax } from "@/components/global/connect-parallax";
import { ContainerScroll } from "@/components/global/container-scroll-animation";
import { InfiniteMovingCards } from "@/components/global/infinite-moving-card";
import Navbar from "@/components/global/navbar";
import { clients, products } from "@/lib/constants";
import {
  Zap,
  GitBranch,
  Webhook,
  Clock,
  Code2,
  Brain,
  ArrowRight,
  CheckIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ─── Features ────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: GitBranch,
    title: "Visual workflow builder",
    description:
      "Drag-and-drop canvas with real-time preview. Connect nodes, set conditions, and build complex automations without writing a line of code.",
  },
  {
    icon: Webhook,
    title: "Webhook triggers",
    description:
      "Start any workflow with an incoming HTTP request. Each workflow gets a unique, secure endpoint ready to receive data from any service.",
  },
  {
    icon: Brain,
    title: "AI-powered steps",
    description:
      "Drop in an AI node to summarise text, classify data, or generate content. Plug the output directly into the next step.",
  },
  {
    icon: Code2,
    title: "Custom code nodes",
    description:
      "Write JavaScript directly in the canvas for logic beyond built-in nodes. Full access to all upstream node data.",
  },
  {
    icon: Clock,
    title: "Wait & schedule",
    description:
      "Pause a workflow for minutes, hours, or days without holding a thread. Built on durable execution with automatic retries.",
  },
  {
    icon: Zap,
    title: "10+ integrations",
    description:
      "Slack, Discord, Notion, Gmail, Google Drive, and more — each with dedicated nodes pre-configured and ready to use.",
  },
];

/* ─── Pricing ─────────────────────────────────────────────── */
const PLANS = [
  {
    name: "Hobby",
    price: "$0",
    period: "forever",
    description: "For personal projects and exploration.",
    features: [
      "3 active workflows",
      "100 task executions / month",
      "Webhook triggers",
      "Community support",
    ],
    cta: "Start for free",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    description: "For teams shipping real automation.",
    features: [
      "Unlimited workflows",
      "10,000 task executions / month",
      "All nodes incl. AI & Code",
      "Execution logs & history",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    href: "/sign-up",
    highlight: true,
  },
  {
    name: "Unlimited",
    price: "$99",
    period: "/ month",
    description: "For power users with no limits.",
    features: [
      "Everything in Pro",
      "Unlimited task executions",
      "Custom webhook domains",
      "Dedicated onboarding",
      "SLA guarantee",
    ],
    cta: "Contact us",
    href: "/sign-up",
    highlight: false,
  },
];

/* ─── Integration logos ───────────────────────────────────── */
const INTEGRATIONS = [
  { name: "Google Drive", src: "/googleDrive.png" },
  { name: "Slack",        src: "/slack.png" },
  { name: "Discord",      src: "/discord.png" },
  { name: "Notion",       src: "/notion.png" },
  { name: "Gmail",        src: "/gmail.png" },
  { name: "Zoom",         src: "/zoom.png" },
];

export default function Home() {
  return (
    <main className="bg-neutral-950 text-white overflow-x-hidden">
      <Navbar />

      {/* ── Hero + scroll animation ────────────────────────── */}
      <section className="relative w-full bg-neutral-950">
        {/* Radial glow behind hero */}
        <div className="pointer-events-none absolute top-0 inset-x-0 flex justify-center overflow-hidden">
          <div className="h-[500px] w-[900px] rounded-full bg-indigo-700/15 blur-[120px]" />
        </div>

        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center gap-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs font-medium text-indigo-300">Now in public beta</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-center leading-[1.05]">
                Automate your work,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  visually
                </span>
              </h1>

              <p className="max-w-lg text-sm sm:text-base text-neutral-400 text-center leading-relaxed">
                Node-based workflow automation. Connect your apps, build logic
                with a drag-and-drop canvas, and deploy in seconds.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-colors"
                >
                  Start building for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center h-10 px-5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-neutral-300 transition-colors"
                >
                  See how it works
                </Link>
              </div>

              {/* Integration logos */}
              <div className="flex flex-col items-center gap-3 mt-2">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                  Connects with
                </p>
                <div className="flex items-center gap-3">
                  {INTEGRATIONS.map(({ name, src }) => (
                    <div
                      key={name}
                      className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-1.5"
                    >
                      <Image
                        src={src}
                        alt={name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />
      </section>

      {/* ── Social proof — moving logos ────────────────────── */}
      <section className="py-12 border-y border-white/[0.06]">
        <p className="text-center text-xs text-neutral-500 uppercase tracking-widest mb-8">
          Trusted by teams everywhere
        </p>
        <InfiniteMovingCards
          items={clients}
          direction="right"
          speed="slow"
        />
      </section>

      {/* ── Parallax product showcase ──────────────────────── */}
      <section className="bg-neutral-950">
        <HeroParallax products={products} />
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className="px-6 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need to automate
          </h2>
          <p className="mt-3 text-sm text-neutral-400 max-w-lg mx-auto">
            A complete toolkit for building, running, and monitoring workflow
            automations — from simple notifications to complex multi-step pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-neutral-950 p-6 flex flex-col gap-3 hover:bg-neutral-900/60 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Icon className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-sm text-neutral-400 max-w-sm mx-auto">
            Start free. Scale when you need to. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(({ name, price, period, description, features, cta, href, highlight }) => (
            <div
              key={name}
              className={`relative rounded-2xl p-6 flex flex-col gap-6 border transition-all ${
                highlight
                  ? "bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-900/30"
                  : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
              }`}
            >
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  Most popular
                </div>
              )}

              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${highlight ? "text-indigo-200" : "text-neutral-400"}`}>
                  {name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tight">{price}</span>
                  <span className={`text-sm mb-1 ${highlight ? "text-indigo-200" : "text-neutral-500"}`}>
                    {period}
                  </span>
                </div>
                <p className={`mt-2 text-xs ${highlight ? "text-indigo-200" : "text-neutral-400"}`}>
                  {description}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs">
                    <CheckIcon
                      className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${highlight ? "text-white" : "text-indigo-400"}`}
                    />
                    <span className={highlight ? "text-indigo-100" : "text-neutral-300"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`inline-flex items-center justify-center h-9 rounded-lg text-sm font-medium transition-colors ${
                  highlight
                    ? "bg-white text-indigo-700 hover:bg-indigo-50"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-2xl mx-auto text-center">
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-600/10 px-8 py-12 flex flex-col items-center gap-5">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Start automating today
          </h2>
          <p className="text-sm text-neutral-400 max-w-sm">
            Join the beta and build your first workflow in under 5 minutes.
            Free to start, no credit card required.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-colors"
          >
            Create free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-indigo-600 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white fill-white" />
            </div>
            <span className="text-xs font-semibold text-white">Zyflow</span>
            <span className="text-xs text-neutral-600 ml-2">
              © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/sign-in"
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
