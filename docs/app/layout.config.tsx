import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { CircleDot } from "lucide-react";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		title: (
			<>
				<CircleDot className="h-6 w-6" aria-label="Logo" />
				Centroid
			</>
		),
	},
	links: [
		{
			text: "Documentation",
			url: "/",
			active: "nested-url",
		},
	],
};
