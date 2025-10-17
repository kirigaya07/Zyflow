import axios from "axios";
import { NextResponse, NextRequest } from "next/server";
import url from "url";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const guild_id = req.nextUrl.searchParams.get("guild_id");
    const error = req.nextUrl.searchParams.get("error");
    const error_description = req.nextUrl.searchParams.get("error_description");

    console.log("Discord callback received:", {
      code,
      guild_id,
      error,
      error_description,
    });

    // Handle OAuth errors (like user denying access)
    if (error) {
      console.error("Discord OAuth error:", error, error_description);
      return NextResponse.redirect(
        `https://localhost:3000/connections?error=discord_${error}`
      );
    }

    if (!code) {
      console.error("No authorization code received");
      return NextResponse.redirect(
        "https://localhost:3000/connections?error=no_code"
      );
    }

    const data = new url.URLSearchParams();
    data.append("client_id", process.env.DISCORD_CLIENT_ID!);
    data.append("client_secret", process.env.DISCORD_CLIENT_SECRET!);
    data.append("grant_type", "authorization_code");
    data.append(
      "redirect_uri",
      "https://localhost:3000/api/auth/callback/discord"
    );
    data.append("code", code.toString());

    console.log("Exchanging code for token...");
    const output = await axios.post(
      "https://discord.com/api/oauth2/token",
      data,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (output.data) {
      const access = output.data.access_token;
      console.log("Got access token, fetching user guilds...");

      const UserGuilds = await axios.get(
        `https://discord.com/api/users/@me/guilds`,
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      console.log(
        "User guilds:",
        UserGuilds.data.map((g: { id: string; name: string }) => ({
          id: g.id,
          name: g.name,
        }))
      );

      // Get the guilds and find the authorized guild
      const guilds = UserGuilds.data;

      // Use the guild_id from the OAuth authorization if provided
      // Otherwise fall back to the first guild
      let selectedGuild = guilds[0];
      if (guild_id) {
        const matchedGuild = guilds.find(
          (g: { id: string }) => g.id === guild_id
        );
        if (matchedGuild) {
          selectedGuild = matchedGuild;
        }
      }

      if (selectedGuild) {
        // Fetch channels for the selected guild using the bot token
        // Note: We need bot token, not user token for this
        console.log(`Fetching channels for guild ${selectedGuild.id}...`);

        try {
          const botToken = process.env.DISCORD_TOKEN;
          if (!botToken) {
            console.error("Discord bot token not configured");
            return NextResponse.redirect(
              `https://localhost:3000/connections?access_token=${access}&guild_id=${
                selectedGuild.id
              }&guild_name=${encodeURIComponent(
                selectedGuild.name
              )}&discord_setup=true&error=no_bot_token`
            );
          }

          const channelsResponse = await axios.get(
            `https://discord.com/api/guilds/${selectedGuild.id}/channels`,
            {
              headers: {
                Authorization: `Bot ${botToken}`,
              },
            }
          );

          // Find the first text channel
          const textChannel = channelsResponse.data.find(
            (ch: { type: number }) => ch.type === 0 // Type 0 = TEXT channel
          );

          if (!textChannel) {
            console.error("No text channels found in guild");
            return NextResponse.redirect(
              `https://localhost:3000/connections?access_token=${access}&guild_id=${
                selectedGuild.id
              }&guild_name=${encodeURIComponent(
                selectedGuild.name
              )}&discord_setup=true&error=no_text_channels`
            );
          }

          // Check if webhook already exists for this channel
          console.log(
            `Checking for existing webhooks in channel ${textChannel.name}...`
          );
          const existingWebhooksResponse = await axios.get(
            `https://discord.com/api/channels/${textChannel.id}/webhooks`,
            {
              headers: {
                Authorization: `Bot ${botToken}`,
              },
            }
          );

          // Look for our Zyflow webhook
          let webhook = existingWebhooksResponse.data.find(
            (wh: { name: string }) => wh.name === "Zyflow Webhook"
          );

          // If no webhook exists, create one
          if (!webhook) {
            console.log(
              `Creating new webhook in channel ${textChannel.name}...`
            );
            const webhookResponse = await axios.post(
              `https://discord.com/api/channels/${textChannel.id}/webhooks`,
              {
                name: "Zyflow Webhook",
              },
              {
                headers: {
                  Authorization: `Bot ${botToken}`,
                  "Content-Type": "application/json",
                },
              }
            );
            webhook = webhookResponse.data;
            console.log("Webhook created successfully:", webhook.id);
          } else {
            console.log("Using existing webhook:", webhook.id);
          }

          // Redirect with webhook details
          return NextResponse.redirect(
            `https://localhost:3000/connections?` +
              `webhook_id=${webhook.id}&` +
              `webhook_url=${encodeURIComponent(webhook.url)}&` +
              `webhook_name=${encodeURIComponent(webhook.name)}&` +
              `channel_id=${textChannel.id}&` +
              `guild_id=${selectedGuild.id}&` +
              `guild_name=${encodeURIComponent(selectedGuild.name)}`
          );
        } catch (webhookError: any) {
          console.error(
            "Error creating webhook:",
            webhookError.response?.data || webhookError.message
          );
          // Fall back to setup mode
          return NextResponse.redirect(
            `https://localhost:3000/connections?access_token=${access}&guild_id=${
              selectedGuild.id
            }&guild_name=${encodeURIComponent(
              selectedGuild.name
            )}&discord_setup=true&error=webhook_creation_failed`
          );
        }
      } else {
        return NextResponse.redirect(
          "https://localhost:3000/connections?error=no_guilds"
        );
      }
    } else {
      return NextResponse.redirect(
        "https://localhost:3000/connections?error=no_token"
      );
    }

    // This should never be reached, but just in case
    return NextResponse.redirect(
      "https://localhost:3000/connections?error=unknown"
    );
  } catch (error) {
    console.error("Discord OAuth error:", error);
    return NextResponse.redirect(
      "https://localhost:3000/connections?error=oauth_failed"
    );
  }
}
