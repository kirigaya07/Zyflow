import React from "react";
import WorkflowButton from "./_components/workflow-button";
import Workflows from "./_components";

const Page = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Workflows
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Build and manage your automation pipelines.
          </p>
        </div>
        <WorkflowButton />
      </div>

      {/* List */}
      <Workflows />
    </div>
  );
};

export default Page;
