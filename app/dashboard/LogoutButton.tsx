'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  return (
    <button
      className="btn-secondary"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
      }}
    >
      Sair
    </button>
  );
}
