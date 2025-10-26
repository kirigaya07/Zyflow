"use server";
import { Option } from "@/components/ui/multiple-selector";
import { db } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";

export const getGoogleListener = async () => {
  const { userId } = await auth();

  if (userId) {
    const listener = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
      select: {
        googleResourceId: true,
      },
    });

    if (listener) return listener;
  }
};

export const onFlowPublish = async (workflowId: string, state: boolean) => {
  console.log(state);
  const published = await db.workflows.update({
    where: {
      id: workflowId,
    },
    data: {
      publish: state,
    },
  });

  if (published.publish) return "Workflow published";
  return "Workflow unpublished";
};

export const onCreateNodeTemplate = async (
  content: string,
  type: string,
  workflowId: string,
  channels?: Option[],
  accessToken?: string,
  notionDbId?: string,
  emailRecipients?: Option[],
  emailSubject?: string,
  zoomMeetingId?: string,
  zoomMeetingTitle?: string
) => {
  if (type === "Discord") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        discordTemplate: content,
      },
    });

    if (response) {
      return "Discord template saved";
    }
  }
  if (type === "Slack") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        slackTemplate: content,
        slackAccessToken: accessToken,
      },
    });

    if (response) {
      // Clear existing channels and add new ones
      if (channels && channels.length > 0) {
        await db.workflows.update({
          where: {
            id: workflowId,
          },
          data: {
            slackChannels: channels.map((channel) => channel.value),
          },
        });
      }
      return "Slack template saved";
    }
  }

  if (type === "Notion") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        notionTemplate: content,
        notionAccessToken: accessToken,
        notionDbId: notionDbId,
      },
    });

    if (response) return "Notion template saved";
  }

  if (type === "Email") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        emailTemplate: content,
        emailSubject: emailSubject,
      },
    });

    if (response) {
      // Clear existing recipients and add new ones
      if (emailRecipients && emailRecipients.length > 0) {
        await db.workflows.update({
          where: {
            id: workflowId,
          },
          data: {
            emailRecipients: emailRecipients.map(
              (recipient) => recipient.value
            ),
          },
        });
      }
      return "Email template saved";
    }
  }

  if (type === "Zoom") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        zoomMeetingId: zoomMeetingId,
        zoomMeetingTitle: zoomMeetingTitle,
        zoomSummary: content,
      },
    });

    if (response) {
      return "Zoom template saved";
    }
  }
};

export const onGetWorkflows = async () => {
  const user = await currentUser();
  if (user) {
    const workflow = await db.workflows.findMany({
      where: {
        userId: user.id,
      },
    });

    if (workflow) return workflow;
  }
};

export const onCreateWorkflow = async (name: string, description: string) => {
  const user = await currentUser();

  if (user) {
    //create new workflow
    const workflow = await db.workflows.create({
      data: {
        userId: user.id,
        name,
        description,
      },
    });

    if (workflow) return { message: "workflow created" };
    return { message: "Oops! try again" };
  }
};

export const onGetNodesEdges = async (flowId: string) => {
  const nodesEdges = await db.workflows.findUnique({
    where: {
      id: flowId,
    },
    select: {
      nodes: true,
      edges: true,
    },
  });
  if (nodesEdges?.nodes && nodesEdges?.edges) return nodesEdges;
};
