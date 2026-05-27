import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFAF8] p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F0ECE6]">
          <span className="text-4xl font-bold text-[#9CA3AF]">404</span>
        </div>
        <h1 className="text-2xl font-bold text-dark mb-2">
          Page introuvable
        </h1>
        <p className="text-sm text-[#69708A] mb-8">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-light transition-colors"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
