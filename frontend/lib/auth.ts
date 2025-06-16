import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return session;
}

export async function getUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function getUserOrRedirect() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
