import { cookies } from "next/headers";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../../(auth)/auth";
import { ConnectionHeader } from "@/components/connection-header";

export const experimental_ppr = true;

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [session, cookieStore] = await Promise.all([auth(), await cookies()]);
	const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";

	return (
		<SidebarProvider defaultOpen={!isCollapsed}>
			<AppSidebar user={session?.user} />
			<SidebarInset>
				<ConnectionHeader />
				<div className="flex-1 h-[calc(100vh-4rem)] flex items-center justify-center">
					<div className="w-full max-w-6xl mx-auto">{children}</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
