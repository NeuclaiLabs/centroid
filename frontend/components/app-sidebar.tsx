"use client";

import type { User } from "next-auth";
import { useRouter } from "next/navigation";
import {
	BarChartIcon,
	ClipboardListIcon,
	FileCodeIcon,
	FileIcon,
	FileTextIcon,
	HelpCircleIcon,
	LayoutDashboardIcon,
	ListIcon,
	Network,
	SearchIcon,
	SettingsIcon,
	UsersIcon,
	FolderIcon,
	CameraIcon,
	DatabaseIcon,
	SendIcon,
	ScrollTextIcon,
	WrenchIcon,
	BotIcon,
	ServerIcon,
	CircleDot,
} from "lucide-react";

import { PlusIcon } from "@/components/icons";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	useSidebar,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";

export function AppSidebar({ user }: { user: User | undefined }) {
	const router = useRouter();
	const { setOpenMobile } = useSidebar();
	const data = {
		user: {
			name: "shadcn",
			email: "m@example.com",
			avatar: "/avatars/shadcn.jpg",
		},
		navMain: [
			{
				title: "Templates",
				url: "/mcp/templates",
				icon: LayoutDashboardIcon,
			},
			{
				title: "Agents",
				url: "/agents",
				icon: BotIcon,
			},
			{
				title: "Servers",
				url: "/mcp/servers",
				icon: ServerIcon,
			},
			{
				title: "Logs",
				url: "/logs",
				icon: ScrollTextIcon,
			},
			// {
			// 	title: "Lifecycle",
			// 	url: "#",
			// 	icon: ListIcon,
			// },
			// {
			// 	title: "Analytics",
			// 	url: "#",
			// 	icon: BarChartIcon,
			// },
			// {
			// 	title: "Projects",
			// 	url: "#",
			// 	icon: FolderIcon,
			// },
			// {
			// 	title: "Team",
			// 	url: "#",
			// 	icon: UsersIcon,
			// },
		],
		navClouds: [
			{
				title: "Capture",
				icon: CameraIcon,
				isActive: true,
				url: "#",
				items: [
					{
						title: "Active Proposals",
						url: "#",
					},
					{
						title: "Archived",
						url: "#",
					},
				],
			},
			{
				title: "Proposal",
				icon: FileTextIcon,
				url: "#",
				items: [
					{
						title: "Active Proposals",
						url: "#",
					},
					{
						title: "Archived",
						url: "#",
					},
				],
			},
			{
				title: "Prompts",
				icon: FileCodeIcon,
				url: "#",
				items: [
					{
						title: "Active Proposals",
						url: "#",
					},
					{
						title: "Archived",
						url: "#",
					},
				],
			},
		],
		navSecondary: [
			// {
			// 	title: "Settings",
			// 	url: "#",
			// 	icon: SettingsIcon,
			// },
			{
				title: "Get Help",
				url: "https://discord.com/invite/CNWq2PxX8V",
				icon: HelpCircleIcon,
			},
			{
				title: "Feedback",
				url: "https://github.com/NeuclaiLabs/centroid/issues/new?template=feedback.yml",
				icon: SendIcon,
			},
			// {
			// 	title: "Search",
			// 	url: "#",
			// 	icon: SearchIcon,
			// },
		],
		documents: [
			{
				name: "Data Library",
				url: "#",
				icon: DatabaseIcon,
			},
			{
				name: "Reports",
				url: "#",
				icon: ClipboardListIcon,
			},
			{
				name: "Word Assistant",
				url: "#",
				icon: FileIcon,
			},
		],
	};
	return (
		<Sidebar className="group-data-[side=left]:border-r-0">
			<SidebarHeader>
				<SidebarMenu>
					<div className="flex flex-row justify-between items-center">
						<Link
							href="/apps"
							onClick={() => {
								setOpenMobile(false);
							}}
							className="flex flex-row gap-3 items-center"
						>
							<span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer flex items-center gap-1">
								<CircleDot className="h-5 w-5" />
								Centroid
							</span>
						</Link>
						{/* <Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									type="button"
									className="p-2 h-fit"
									onClick={() => {
										setOpenMobile(false);
										router.push("/");
										router.refresh();
									}}
								>
									<PlusIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent align="end">New Chat</TooltipContent>
						</Tooltip> */}
					</div>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{/* <SidebarGroup>
					<SidebarGroupLabel>Platform</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem key="apps">
								<SidebarMenuButton asChild>
									<Link href="/apps">
										<Network className="h-4 w-4" />
										<span>Apps</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup> */}
				<NavMain items={data.navMain} />
				<NavSecondary items={data.navSecondary} className="mt-auto" />

				{/* <NavDocuments items={data.documents} />
				{/* <SidebarHistory user={user} /> */}
			</SidebarContent>
			<SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
		</Sidebar>
	);
}
