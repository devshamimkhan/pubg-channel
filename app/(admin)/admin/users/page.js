export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import UserManagementClient from "./UserManagementClient";
import { createSeoMetadata } from "@/lib/seo-metadata";

export async function generateMetadata() {
  return createSeoMetadata(null, {
    pageTitle: "User Management",
    pageDescription: "Manage community members and moderation settings.",
    noIndex: true,
  });
}

export default async function AdminUsersPage() {
  await connectDB();

  const session = await getServerSession(authOptions);
  const users = await User.find().sort({ createdAt: -1 }).lean();

  return (
    <UserManagementClient
      initialUsers={JSON.parse(JSON.stringify(users))}
      currentUserId={session?.user?.id || ""}
    />
  );
}
