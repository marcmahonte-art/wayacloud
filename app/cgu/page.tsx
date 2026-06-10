import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Globe } from "lucide-react";

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F6] font-jost text-[#121212] pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-[#FF6300]">Waya<span className="text-[#121212]">Cloud</span></span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#F3F4F6] transition-colors"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-12">
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-10 shadow-card">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#121212] sm:text-4xl mb-2">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-sm text-[#6B7280] mb-8">
            Dernière mise à jour : 10 juin 2026
          </p>

          {/* Quick Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-3 rounded-2xl bg-[#FFF3ED] p-4 text-[#FF6300]">
              <ShieldCheck size={24} className="shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#121212]">Sécurisé</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">Données chiffrées</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-600">
              <Lock size={24} className="shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#121212]">Privé</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">Souveraineté locale</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-[#EDE9FE] p-4 text-violet-600">
              <Globe size={24} className="shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#121212]">Burkina Faso</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">Équipe basée à Ouaga</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-[15px] leading-7 text-[#4B5563]">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#121212]">1. Introduction</h2>
              <p>
                Bienvenue sur WayaCloud. En accédant ou en utilisant nos services, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation (CGU). Veuillez les lire attentivement. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser WayaCloud.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#121212]">2. Description des Services</h2>
              <p>
                WayaCloud fournit un service de stockage en ligne, de sauvegarde intelligente (notamment pour les historiques de discussions de messagerie comme WhatsApp) et un assistant IA permettant de résumer et de chercher dans vos documents. L'accès à ces services peut se faire via des plans gratuits ou payants, soumis à des limites de stockage spécifiques.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#121212]">3. Utilisation de l'Assistant IA</h2>
              <p>
                L'assistant IA de WayaCloud utilise des modèles d'intelligence artificielle avancés pour analyser vos fichiers et vous fournir des réponses. Vous comprenez que les résumés et analyses fournis par l'IA sont générés de manière automatique et ne sauraient remplacer un conseil juridique, médical ou professionnel qualifié. Vous restez responsable de la vérification des données importantes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#121212]">4. Confidentialité et Protection des Données</h2>
              <p>
                Nous prenons la protection de votre vie privée très au sérieux. WayaCloud s'engage à respecter les réglementations en vigueur sur la protection des données personnelles, notamment les lois sur la protection des données personnelles au Burkina Faso. Vos fichiers sont chiffrés et ne sont jamais vendus à des tiers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#121212]">5. Abonnements et Paiements</h2>
              <p>
                Les formules payantes vous permettent d'étendre votre espace de stockage disponible. Les transactions s'effectuent de manière sécurisée via nos prestataires agréés au Burkina Faso (Mobile Money, cartes bancaires). Tout abonnement entamé est dû pour la période de facturation souscrite et ne donne lieu à aucun remboursement partiel en cas de résiliation anticipée.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#121212]">6. Responsabilités de l'Utilisateur</h2>
              <p>
                Vous êtes entièrement responsable du contenu que vous stockez ou partagez sur WayaCloud. Il vous est interdit de stocker ou diffuser des fichiers illégaux, diffamatoires, ou enfreignant des droits de propriété intellectuelle. WayaCloud se réserve le droit de suspendre tout compte ne respectant pas ces directives.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#121212]">7. Modifications des Conditions</h2>
              <p>
                Nous pouvons modifier ces conditions à tout moment pour refléter les changements technologiques, législatifs ou opérationnels. En continuant d'utiliser le service après modification, vous acceptez les nouvelles conditions d'utilisation.
              </p>
            </section>

            <section className="pt-6 border-t border-[#E5E7EB] flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">© {new Date().getFullYear()} WayaCloud. Tous droits réservés.</span>
              <Link href="/" className="text-xs font-bold text-[#FF6300] hover:underline">
                Retourner à l'accueil
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
