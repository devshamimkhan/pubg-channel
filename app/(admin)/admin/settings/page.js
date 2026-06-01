import { editSiteSettings } from "@/actions/settings";
import { getChannels } from "@/actions/channels";
import AdminSettingsClient from "./AdminSettingsClient";
import { createSeoMetadata } from "@/lib/seo-metadata";

export async function generateMetadata() {
  return createSeoMetadata(null, {
    pageTitle: "Site Settings",
    pageDescription: "Manage site branding, homepage content, social links, and SEO settings.",
    noIndex: true,
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
