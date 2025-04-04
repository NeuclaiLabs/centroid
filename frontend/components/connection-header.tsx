"use client";

import { SidebarToggle } from "@/components/sidebar-toggle";

export function ConnectionHeader() {
	return (
		<header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
			<SidebarToggle />
			<h1 className="text-xl font-semibold flex-1 text-center">Apps</h1>
			<div className="w-10" /> {/* Spacer to balance the layout */}
		</header>
	);
}
