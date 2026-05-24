interface SharePageProps {
  params: {
    token: string;
  };
}

export default function SharePage({ params }: SharePageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-lg rounded-card border border-border bg-card p-8 shadow-card">
        <p className="text-sm font-semibold text-primary">Lien public</p>
        <h1 className="mt-2 text-2xl font-bold text-dark">Partage WayaCloud</h1>
        <p className="mt-3 break-all text-sm text-gray">Jeton : {params.token}</p>
      </section>
    </main>
  );
}
