export function LoadingState() {
	return (
		<div className="flex items-center justify-center h-64">
			<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
		</div>
	);
}

export function ErrorState() {
	return (
		<div className="flex items-center justify-center h-64">
			<div className="text-destructive">Failed to load data</div>
		</div>
	);
}
