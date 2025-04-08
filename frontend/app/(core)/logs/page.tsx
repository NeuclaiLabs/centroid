import { ScrollTextIcon } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function LogsPage() {
	return (
		<div className="px-4">
			<Card className="max-w-2xl mx-auto">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<ScrollTextIcon className="h-12 w-12 text-primary" />
					</div>
					<CardTitle className="text-2xl font-bold">
						Tool Execution Logs
					</CardTitle>
					<CardDescription className="text-lg mt-2">
						Coming Soon
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-muted-foreground">
						Track, monitor, and analyze all your LLM-based tool executions in
						one place. Get detailed insights into prompts, completions, and
						performance metrics.
					</p>
					<div className="mt-6 space-y-4">
						<div className="flex items-center justify-center gap-2">
							<span className="text-sm text-muted-foreground">
								Upcoming Features:
							</span>
						</div>
						<ul className="text-sm text-muted-foreground space-y-2">
							<li>• Performance metrics and latency tracking</li>
							<li>• Error tracking and debugging tools</li>
							<li>• Custom filters for tool types and models</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
