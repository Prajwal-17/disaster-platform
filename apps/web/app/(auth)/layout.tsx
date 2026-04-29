export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-surface flex min-h-screen items-center justify-center px-4 py-8">
      {children}
    </div>
  );
}
