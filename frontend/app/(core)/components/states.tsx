import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LoadingState() {
	return (
		<div className="flex-1 p-6 flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
				<p className="text-muted-foreground">Loading connections...</p>
			</div>
		</div>
	);
}

export function ErrorState() {
	return (
		<div className="flex-1 p-6">
			<Alert variant="destructive">
				<AlertCircle className="size-4" />
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>
					Failed to load connections. Please try again later.
				</AlertDescription>
			</Alert>
		</div>
	);
}
