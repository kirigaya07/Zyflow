import React from "react";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">Terms of Use</h1>
      <div className="prose max-w-none">
        <p className="text-muted-foreground mb-4">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Acceptance of Terms</h2>
          <p>
            By accessing and using Zyflow, you accept and agree to be bound by
            the terms and provision of this agreement.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Use License</h2>
          <p>
            Permission is granted to temporarily use Zyflow for personal,
            non-commercial purposes. You may not:
          </p>
          <ul className="list-disc ml-6">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            Third-Party Integrations
          </h2>
          <p>
            Zyflow integrates with Zoom, Google Drive, OpenAI, and other
            third-party services. Your use of these integrations is subject to
            their respective terms of service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            Limitation of Liability
          </h2>
          <p>
            In no event shall Zyflow or its suppliers be liable for any damages
            arising out of the use or inability to use the materials on Zyflow's
            website.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Account Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account at any
            time for violation of these terms.
          </p>
        </section>
      </div>
    </div>
  );
}
