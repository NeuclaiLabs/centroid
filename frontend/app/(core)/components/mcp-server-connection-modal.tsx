import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MCPServer } from "@/app/(core)/types";

interface MCPServerConnectionModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	server: MCPServer;
}

export function MCPServerConnectionModal({
	isOpen,
	onOpenChange,
	server,
}: MCPServerConnectionModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Connect to {server.name}</DialogTitle>
				</DialogHeader>
				<Tabs defaultValue="cursor" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="cursor">Cursor</TabsTrigger>
						<TabsTrigger value="github-copilot">GitHub Copilot</TabsTrigger>
					</TabsList>
					<TabsContent value="cursor" className="mt-4">
						<pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
							{JSON.stringify({ url: server.mountPath }, null, 2)}
						</pre>
					</TabsContent>
					<TabsContent value="github-copilot" className="mt-4">
						<pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
							{JSON.stringify({ url: server.mountPath }, null, 2)}
						</pre>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
