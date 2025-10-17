"use client";

import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { onFlowPublish } from "../_actions/workflow-connections";
import { toast } from "sonner";
// import { toast } from "sonner";
// import { onFlowPublish } from "../_actions/workflow-connections";

type Props = {
  name: string;
  description: string;
  id: string;
  publish: boolean | null;
};

const Workflow = ({ description, id, name, publish }: Props) => {
  const onPublishFlow = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const response = await onFlowPublish(
      id,
      event.currentTarget.ariaChecked === "false"
    );
    if (response) toast.message(response);
  };

  return (
    <Card className="flex w-full items-center justify-between min-h-[120px]">
      <CardHeader className="flex-1 py-0">
        <Link href={`/workflows/editor/${id}`} className="block">
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
        </Link>
      </CardHeader>
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-0 min-w-[80px]">
        <Label
          htmlFor={`switch-${id}`}
          className="text-muted-foreground text-sm font-medium"
        >
          {publish! ? "On" : "Off"}
        </Label>
        <Switch
          id={`switch-${id}`}
          onClick={onPublishFlow}
          defaultChecked={publish!}
        />
      </div>
    </Card>
  );
};

export default Workflow;
