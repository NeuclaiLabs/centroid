"use client";

import { usePathname } from "next/navigation";
import { SidebarToggle } from "@/components/sidebar-toggle";

export function ConnectionHeader() {
	const pathname = usePathname();
	const pathSegments = pathname?.split("/") || [];
	const lastSegment = pathSegments[pathSegments.length - 1] || "Apps";

	const titleMap: Record<string, string> = {
		"mcp-templates": "MCP Templates",
		logs: "Logs",
		"mcp-servers": "MCP Servers",
	};

	const title = titleMap[lastSegment] || lastSegment;

	return (
		<header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
			<SidebarToggle />
			<h1 className="text-xl font-semibold flex-1 text-center">{title}</h1>
			<div className="w-10" /> {/* Spacer to balance the layout */}
		</header>
	);
}
