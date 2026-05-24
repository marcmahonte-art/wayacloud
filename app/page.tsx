import { ArrowRight, Database, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";

const points = [
  {
    icon: LockKeyhole,
    title: "Stockage souverain",
    text: "Données protégées, accès contrôlés et partage sécurisé pour les particuliers et PME du Burkina Faso.",
  },
  {
    icon: Sparkles,
    title: "IA intégrée",
    text: "Résumé de documents, assistant intelligent et recherche plus rapide dans les fichiers.",
  },
  {
    icon: Database,
    title: "Plans en Go",
    text: "Offres claires en FCFA, pensées pour Bobo-Dioulasso, Koudougou et Ouagadougou.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            WayaCloud
          </p>
          <h1 className="text-4xl font-bold leading-tight text-dark sm:text-6xl">
            AI-Powered Cloud Storage for Africa. Secure. Intelligent. Limitless.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray">
            Une plateforme cloud souveraine pour sauvegarder, organiser et
            partager les fichiers en toute simplicité, avec une interface en
            français et un support client en Mooré.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-btn bg-primary px-5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-light"
            >
              Commencer
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center rounded-btn border border-border bg-card px-5 text-sm font-semibold text-dark transition hover:border-primary"
            >
              Voir le dashboard
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {points.map((point) => (
            <article
              key={point.title}
              className="rounded-card border border-border bg-card p-6 shadow-card"
            >
              <point.icon className="mb-5 text-primary" size={28} />
              <h2 className="text-lg font-semibold text-dark">{point.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray">{point.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
