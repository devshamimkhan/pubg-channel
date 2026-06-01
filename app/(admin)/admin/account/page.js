export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import AccountSettingsClient from "./AccountSettingsClient";
import { createSeoMetadata } from "@/lib/seo-metadata";

export async function generateMetadata() {
  return createSeoMetadata(null, {
    pageTitle: "Account Settings",
    pageDescription: "Manage your admin profile and credentials.",
    noIndex: true,
  });
}

export default async function AdminAccountPage() {
  await connectDB();

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || "";

  const user = userId ? await User.findById(userId).lean() : null;

  return (
    <AccountSettingsClient
      initialUser={user ? JSON.parse(JSON.stringify(user)) : null}
      currentUserId={userId}
    />
  );
}
