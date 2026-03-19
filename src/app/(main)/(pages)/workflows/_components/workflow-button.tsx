"use client";
import Workflowform from "@/components/forms/workflow-form";
import CustomModal from "@/components/global/custom-model";
import { Button } from "@/components/ui/button";
import { useModal } from "@/providers/model-provider";
import { Plus } from "lucide-react";
import React from "react";

type Props = object;

const WorkflowButton = (props: Props) => {
  const { setOpen, setClose } = useModal();
  const handleClick = () => {
    setOpen(
      <CustomModal
        title="Create a Workflow Automation"
        subheading="Workflows are a powerful tool that help you automate tasks."
      >
        <Workflowform />
      </CustomModal>
    );
  };

  return (
    <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleClick}>
      <Plus className="h-3.5 w-3.5" />
      New Workflow
    </Button>
  );
};

export default WorkflowButton;
