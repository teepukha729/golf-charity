import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/subscriber/DashboardSidebar';

export default async function SubscriberLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  // Allow access if admin, has active subscription, or has ANY subscription history
  const canAccess =
    session.user.role === 'admin' ||
    session.user.hasActiveSubscription ||
    session.user.hasEverSubscribed;
  if (!canAccess) redirect('/subscribe');

  return (
    <div className="min-h-screen flex bg-[#0a0f0d]">
      <DashboardSidebar user={session.user} />
      {/*
        ml-0 on mobile  (sidebar is a drawer, not in flow)
        ml-64 on md+    (sidebar is fixed 256px column)

        pt-14 on mobile (clears the fixed mobile header bar, h-14 = 56px)
        pt-0  on md+    (no top bar; sidebar is beside content)
      */}
      <main className="flex-1 ml-0 md:ml-64 min-h-screen pt-14 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}