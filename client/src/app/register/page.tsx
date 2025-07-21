// app/register/page.tsx
import Registration from '@/components/Registration';
import AuthGuard from '@/components/AuthGuard';

export default function RegisterPage() {
  return (
    <AuthGuard>
      <Registration />
    </AuthGuard>
  );
}