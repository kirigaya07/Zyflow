"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Copy, Trash2 } from "lucide-react";
import {
  onFlowPublish,
  deleteWorkflow,
  duplicateWorkflow,
} from "../_actions/workflow-connections";
import { toast } from "sonner";
import { LoadingLink } from "@/components/global/loading-link";

type LastRun = {
  status: string;
  createdAt: Date;
  message?: string | null;
} | null;

type Props = {
  name: string;
  description: string;
  id: string;
  publish: boolean | null;
  lastRun?: LastRun;
};

const statusColors: Record<string, string> = {
  success: "bg-green-500/20 text-green-400 border border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border border-red-500/30",
  skipped: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

const Workflow = ({ description, id, name, publish, lastRun }: Props) => {
  const router = useRouter();

  const onPublishFlow = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const response = await onFlowPublish(
      id,
      event.currentTarget.ariaChecked === "false"
    );
    if (response) toast.message(response);
  };

  const onDuplicate = async () => {
    const result = await duplicateWorkflow(id);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Workflow duplicated");
      router.refresh();
    }
  };

  const onDelete = async () => {
    const result = await deleteWorkflow(id);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Workflow deleted");
      router.refresh();
    }
  };

  return (
    <Card className="flex w-full items-center justify-between min-h-[120px]">
      <CardHeader className="flex-1 py-0">
        <LoadingLink href={`/workflows/editor/${id}`} className="block">
          <div className="flex flex-row gap-3 mb-4">
            <Image
              src="/googleDrive.png"
              alt="Google Drive"
              height={30}
              width={30}
              className="object-contain"
            />
            <Image
              src="/notion.png"
              alt="Notion"
              height={30}
              width={30}
              className="object-contain"
            />
            <Image
              src="/discord.png"
              alt="Discord"
              height={30}
              width={30}
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-xl mb-2">{name}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </LoadingLink>
      </CardHeader>

      <div className="flex items-center gap-3 px-6 py-0">
        {/* Last run badge */}
        {lastRun && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[lastRun.status] ?? statusColors.skipped}`}
          >
            {lastRun.status}
          </span>
        )}

        {/* Publish toggle */}
        <div className="flex flex-col items-center gap-1 min-w-[50px]">
          <Label
            htmlFor={`switch-${id}`}
            className="text-muted-foreground text-sm font-medium"
          >
            {publish ? "On" : "Off"}
          </Label>
          <Switch
            id={`switch-${id}`}
            onClick={onPublishFlow}
            defaultChecked={publish!}
          />
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default Workflow;
