export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background bg-gradient-to-b from-brand-tint via-background to-background">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-300/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="relative w-full px-4 py-8">
        {children}
      </div>
    </div>
  )
}
