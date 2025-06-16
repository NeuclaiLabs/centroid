import { cookies } from "next/headers";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ConnectionHeader } from "@/components/connection-header";
import { requireAuth } from "@/lib/auth";

export const experimental_ppr = true;

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [session, cookieStore] = await Promise.all([requireAuth(), await cookies()]);
	const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";

	return (
		<SidebarProvider defaultOpen={!isCollapsed}>
			<AppSidebar user={session?.user} />
			<SidebarInset>
				<ConnectionHeader />
				<div className="max-w-6xl w-full px-6 mx-auto">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
