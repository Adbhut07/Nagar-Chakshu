// app/signin/page.tsx
import SignIn from '@/components/SignIn';
import AuthGuard from '@/components/AuthGuard';

export default function SignInPage() {
  return (
    <AuthGuard>
      <SignIn />
    </AuthGuard>
  );
}