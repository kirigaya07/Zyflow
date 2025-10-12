import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Validate the payload structure
    if (!body?.data) {
      console.error("Invalid webhook payload: missing data");
      return new NextResponse("Invalid webhook payload: missing data", {
        status: 400,
      });
    }

    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      profile_image_url,
    } = body.data;

    // Validate required fields
    if (!id) {
      console.error("Invalid webhook payload: missing user id");
      return new NextResponse("Invalid webhook payload: missing user id", {
        status: 400,
      });
    }

    // Safely get email address
    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      console.error("Invalid webhook payload: missing email");
      return new NextResponse("Invalid webhook payload: missing email", {
        status: 400,
      });
    }

    // Combine first and last name
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || "";

    // Use profile_image_url if available, otherwise fallback to image_url
    const profileImage = profile_image_url || image_url || "";

    console.log("Processing user:", {
      clerkId: id,
      email,
      name: fullName,
      profileImage,
    });

    const user = await db.user.upsert({
      where: { clerkId: id },
      update: {
        email,
        name: fullName,
        profileImage,
      },
      create: {
        clerkId: id,
        email,
        name: fullName,
        profileImage,
        tier: "Free",
        credits: "10",
      },
    });

    console.log("User upserted successfully:", user.id);

    return new NextResponse("User updated in database successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating database:", error);
    return new NextResponse(
      `Error updating user in database: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}
