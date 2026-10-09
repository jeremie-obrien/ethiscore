import { PageHeader } from "@/components/PageHeader";
import { ProfileClient } from "@/components/ProfileClient";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser(await createClient());

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title="Profile" description={user?.email ? `Signed in as ${user.email}` : undefined} />
      <ProfileClient />
    </main>
  );
}
