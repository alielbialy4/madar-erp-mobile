import type { User } from '@/types/api';

export function dashboardGreeting(user: User | null | undefined): string {
  const name = user?.name?.trim();
  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'صباح الخير' : 'مساء الخير';
  return name ? `${salutation}، ${name}` : salutation;
}
