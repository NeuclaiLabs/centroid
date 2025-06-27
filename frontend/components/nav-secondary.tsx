"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavSecondary({
	items,
	...props
}: {
	items: {
		title: string;
		url: string;
		icon: LucideIcon;
	}[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild>
								{item.url.startsWith('http') ? (
									<a
										href={item.url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2"
									>
										<item.icon />
										<span>{item.title}</span>
									</a>
								) : (
									<Link href={item.url} className="flex items-center gap-2">
										<item.icon />
										<span>{item.title}</span>
									</Link>
								)}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
