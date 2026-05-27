import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import UserManagementClient from "./UserManagementClient";

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
