import { Button } from "@/components/ui/button";
import { ArrowRight, Pencil } from "lucide-react";
import { appRegistry } from "@/lib/registry";
import { useConnections } from "../hooks/use-connections";

interface AppHeaderProps {
	appId: string;
	onConnect: (connectionId?: string) => void;
}

export function AppHeader({ appId, onConnect }: AppHeaderProps) {
	const appData = appRegistry[appId];
	const { connections, isLoading } = useConnections({ appId, limit: 1 });
	const existingConnection = connections?.[0];

	return (
		<div className="flex flex-col sm:flex-row items-start gap-4">
			<div className="size-14 shrink-0 rounded-lg flex items-center justify-center bg-primary/10">
				<svg
					role="img"
					viewBox="0 0 24 24"
					className="size-9 text-primary"
					fill="currentColor"
					aria-label={`${appData.name} icon`}
				>
					<path d={appData.icon.path} />
				</svg>
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
					<div className="space-y-2 min-w-0">
						<h1 className="text-xl font-semibold flex items-center gap-2 truncate">
							{appData.name}
						</h1>
						<p className="text-muted-foreground line-clamp-2 sm:line-clamp-1">
							{appData.description}
						</p>
					</div>
					<Button
						size="lg"
						className="h-11 shrink-0"
						onClick={() => onConnect(existingConnection?.id)}
						disabled={isLoading}
					>
						{existingConnection ? (
							<>
								Edit Connection
								<Pencil className="ml-2 size-4" />
							</>
						) : (
							<>
								Connect
								<ArrowRight className="ml-2 size-4" />
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
