"use client";

import { WorkflowFormSchema } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useModal } from "@/providers/model-provider";
import { onCreateWorkflow } from "@/app/(main)/(pages)/workflows/_actions/workflow-connections";
import { toast } from "sonner";

const Workflowform = () => {
  const { setClose } = useModal();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof WorkflowFormSchema>>({
    resolver: zodResolver(WorkflowFormSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = async (values: z.infer<typeof WorkflowFormSchema>) => {
    const name = values.name?.trim();
    if (!name) {
      setError("name", { message: "Name is required" });
      return;
    }
    const workflow = await onCreateWorkflow(name, values.description ?? "");

    if (workflow?.message === "workflow created") {
      toast.success("Workflow created!");
      router.refresh();
      setClose();
    } else if (workflow?.message) {
      toast.error(workflow.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <label htmlFor="wf-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="wf-name"
          placeholder="My workflow"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor="wf-desc" className="text-sm font-medium">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="wf-desc"
          placeholder="What does this workflow do?"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-destructive text-sm">{errors.description.message}</p>
        )}
      </div>

      <Button className="mt-2 w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating…
          </>
        ) : (
          "Create Workflow"
        )}
      </Button>
    </form>
  );
};

export default Workflowform;
