import {
	Card,
	CardHeader,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateConnectionCard() {
	const router = useRouter();

	const handleCardClick = () => {
		router.push(`/tools/new`);
	};

	return (
		<Card
			className="hover:bg-secondary/50 transition-colors cursor-pointer flex flex-col h-full group"
			onClick={handleCardClick}
		>
			<CardHeader className="p-6 flex flex-row items-start justify-between space-y-0">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
							<Plus className="size-5 text-primary" />
						</div>
						<div className="flex flex-col">
							<span className="font-semibold text-sm">Create New</span>
							<span className="text-xs text-muted-foreground">Connection</span>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-6 py-2 space-y-4 flex-grow">
				<p className="text-sm text-muted-foreground">
					Create a new connection to integrate with your tools and services.
				</p>
			</CardContent>
			<CardFooter className="px-6 py-4 mt-auto border-t border-border/40">
				<div className="flex items-center justify-between w-full text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<span className="text-xs">Configure a new tool connection</span>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}
