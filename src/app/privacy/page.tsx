import React from "react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose max-w-none">
        <p className="text-muted-foreground mb-4">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            Information We Collect
          </h2>
          <p>
            We collect information that you provide directly to us, including
            when you:
          </p>
          <ul className="list-disc ml-6">
            <li>Create an account</li>
            <li>Use our services</li>
            <li>Connect third-party integrations (Zoom, Google Drive, etc.)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            How We Use Your Information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc ml-6">
            <li>Provide and improve our services</li>
            <li>Process Zoom recordings and generate summaries</li>
            <li>Send notifications and updates</li>
            <li>Maintain your account and preferences</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Third-Party Services</h2>
          <p>
            Our service integrates with third-party platforms including Zoom,
            Google Drive, OpenAI, Slack, and Discord. Please refer to their
            respective privacy policies for information on how they handle your
            data.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us.
          </p>
        </section>
      </div>
    </div>
  );
}
