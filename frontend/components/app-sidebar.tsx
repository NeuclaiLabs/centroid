"use client";

import type { User } from "next-auth";
import { useRouter } from "next/navigation";
import { useState, } from "react";
import {
	ClipboardListIcon,
	FileCodeIcon,
	FileIcon,
	FileTextIcon,
	HelpCircleIcon,
	LayoutDashboardIcon,
	SearchIcon,
	CameraIcon,
	DatabaseIcon,
	SendIcon,
	ScrollTextIcon,
	BotIcon,
	ServerIcon,
	CircleDot,
	PlusIcon,
	KeyIcon,
} from "lucide-react";

import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	useSidebar,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import Link from "next/link";
import useSWR from "swr";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { Chat } from "@/lib/db/schema";

export function AppSidebar({ user }: { user: User | undefined }) {
	const router = useRouter();
	const { setOpenMobile } = useSidebar();
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch chats for search
	const { data: chatsData } = useSWR(
		user?.id ? `/api/chats/${user.id}` : null,
		async () => {
			return { chats: [], hasMore: false };
			// return getChatsByUserId({
			// 	id: user.id,
			// 	limit: 50,
			// 	startingAfter: null,
			// 	endingBefore: null,
			// });
		}
	);

	const filteredChats = chatsData?.chats?.filter((chat: Chat) =>
		chat.title.toLowerCase().includes(searchQuery.toLowerCase())
	) || [];

	const data = {
		user: {
			name: "shadcn",
			email: "m@example.com",
			avatar: "/avatars/shadcn.jpg",
		},
		navQuick: [
			{
				title: "New Chat",
				url: "/",
				icon: PlusIcon,
			},
			{
				title: "Search Chats",
				url: "#",
				icon: SearchIcon,
				onClick: () => setSearchOpen(true),
			},
		],
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
				title: "Secrets",
				url: "/secrets",
				icon: KeyIcon,
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
		<>
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
						</div>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					{/* Quick Actions */}
					<SidebarGroup>
						<SidebarGroupContent>
							<NavMain items={data.navQuick} />
						</SidebarGroupContent>
					</SidebarGroup>

					{/* Main Navigation */}
					<SidebarGroup>
						<SidebarGroupContent>
							<NavMain items={data.navMain} />
						</SidebarGroupContent>
					</SidebarGroup>

					{/* Chat History */}
					<SidebarGroup>
						<SidebarGroupLabel className="text-sm font-semibold">Chats</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarHistory user={user} />
						</SidebarGroupContent>
					</SidebarGroup>

					<NavSecondary items={data.navSecondary} className="mt-auto" />

					{/* <NavDocuments items={data.documents} />
					{/* <SidebarHistory user={user} /> */}
				</SidebarContent>
				<SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
			</Sidebar>

			<CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
				<CommandInput
					placeholder="Search chats..."
					value={searchQuery}
					onValueChange={setSearchQuery}
				/>
				<CommandList>
					<CommandEmpty>No chats found.</CommandEmpty>
					{filteredChats.length > 0 && (
						<CommandGroup heading="Chats">
							{filteredChats.slice(0, 8).map((chat: Chat) => (
								<CommandItem
									key={chat.id}
									onSelect={() => {
										setSearchOpen(false);
										setSearchQuery("");
										router.push(`/chat/${chat.id}`);
									}}
								>
									<SearchIcon className="mr-2 h-4 w-4" />
									<span className="truncate">{chat.title}</span>
								</CommandItem>
							))}
						</CommandGroup>
					)}
				</CommandList>
			</CommandDialog>
		</>
	);
}
