import { editSiteSettings } from "@/actions/settings";
import { getChannels } from "@/actions/channels";
import AdminSettingsClient from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
  const [settingsResult, channelsResult] = await Promise.all([editSiteSettings(), getChannels()]);

  return (
    <AdminSettingsClient
      initialSettings={settingsResult.success ? settingsResult.settings : null}
      initialChannels={channelsResult.success ? channelsResult.channels : []}
      initialError={settingsResult.success ? "" : settingsResult.message || "Failed to load settings"}
      initialMode={settingsResult.success && settingsResult.settings ? "edit" : "create"}
    />
  );
}
