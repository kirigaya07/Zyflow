import { useEditor } from "@/providers/editor-provider";
import React, { CSSProperties } from "react";
import { Handle, HandleProps } from "@xyflow/react";

type Props = HandleProps & { style?: CSSProperties };

const CustomHandle = (props: Props) => {
  const { state } = useEditor();

  return (
    <Handle
      {...props}
      isValidConnection={(e) => {
        const sourcesFromHandleInState = state.editor.edges.filter(
          (edge) => edge.source === e.source
        ).length;
        const sourceNode = state.editor.elements.find(
          (node) => node.id === e.source
        );
        const targetFromHandleInState = state.editor.edges.filter(
          (edge) => edge.target === e.target
        ).length;

        if (targetFromHandleInState === 1) return false;
        if (sourceNode?.type === "Condition") return true;
        if (sourcesFromHandleInState < 1) return true;
        return false;
      }}
      className="!h-3 !w-3 !border-2 !border-primary !bg-background hover:!bg-primary transition-colors"
    />
  );
};

export default CustomHandle;
