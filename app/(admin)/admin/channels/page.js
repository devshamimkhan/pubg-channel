import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import ChannelManagementClient from "./ChannelManagementClient";
import { getChannels } from "@/actions/channels";
import { getSiteSettings } from "@/actions/settings";

export default async function AdminChannelsPage() {
  const session = await getServerSession(authOptions);
  const [channelsResult, settingsResult] = await Promise.all([getChannels(), getSiteSettings()]);

  return (
    <ChannelManagementClient
      initialChannels={channelsResult?.channels || []}
      initialSettings={settingsResult?.settings || null}
      currentUserId={session?.user?.id || ""}
    />
  );
}
