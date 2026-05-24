export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <p className="text-sm font-semibold text-primary">
          Administration WayaCloud
        </p>
      </header>
      <main className="p-6 lg:p-8">{children}</main>
    </div>
  );
}
