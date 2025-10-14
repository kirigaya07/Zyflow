import { EditorCanvasCardType } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import React, { useMemo } from "react";
import { Position, useNodeId } from "@xyflow/react";

import { Badge } from "@/components/ui/badge";
import EditorCanvasIconHelper from "./editor-canvas-card-icon-helper";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import clsx from "clsx";
import CustomHandle from "./custom-handle";

type Props = object;

const EditorCanvasCardSingle = ({ data }: { data: EditorCanvasCardType }) => {
  const { dispatch, state } = useEditor();
  const nodeId = useNodeId();
  const logo = useMemo(() => {
    return <EditorCanvasIconHelper type={data.type} />;
  }, [data]);

  return (
    <>
      {data.type !== "Trigger" && data.type !== "Google Drive" && (
        <CustomHandle
          type="target"
          position={Position.Top}
          style={{ zIndex: 100 }}
        />
      )}
      <Card
        onClick={(e) => {
          e.stopPropagation();
          const val = state.editor.elements.find((n) => n.id === nodeId);
          if (val)
            dispatch({
              type: "SELECTED_ELEMENT",
              payload: {
                element: val,
              },
            });
        }}
        className="relative w-[280px] min-h-[120px] dark:border-muted-foreground/70"
      >
        <CardHeader className="flex flex-row items-center gap-4 p-4">
          <div className="flex-shrink-0">{logo}</div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {data.title}
            </CardTitle>
            <CardDescription className="text-xs">
              <p className="text-muted-foreground/50 truncate">
                <b className="text-muted-foreground/80">ID: </b>
                {nodeId?.slice(0, 8)}...
              </p>
              <p className="text-muted-foreground/90 line-clamp-2">
                {data.description}
              </p>
            </CardDescription>
          </div>
        </CardHeader>
        <Badge variant="secondary" className="absolute right-2 top-2">
          {data.type}
        </Badge>
        <div
          className={clsx("absolute left-3 top-4 h-2 w-2 rounded-full", {
            "bg-green-500": Math.random() < 0.6,
            "bg-orange-500": Math.random() >= 0.6 && Math.random() < 0.8,
            "bg-red-500": Math.random() >= 0.8,
          })}
        ></div>
      </Card>
      <CustomHandle type="source" position={Position.Bottom} id="a" />
    </>
  );
};

export default EditorCanvasCardSingle;
