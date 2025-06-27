'use client';

import { useRequireAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useRequireAuth();

  if (isLoading) {
    return fallback || (
      <div className="flex flex-col space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5', 'skeleton-6'].map((key) => (
            <Skeleton key={key} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router redirect will handle this
  }

  return <>{children}</>;
}
