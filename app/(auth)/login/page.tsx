"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendOtp } from "./actions";

const initialState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="h-12 w-full rounded-btn bg-primary text-sm font-semibold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Envoi en cours..." : "Recevoir le code"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(sendOtp, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-md rounded-card border border-border bg-card p-8 shadow-card">
        <p className="text-sm font-semibold text-primary">Connexion OTP</p>
        <h1 className="mt-2 text-2xl font-bold text-dark">
          Bienvenue sur WayaCloud
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray">
          Entrez votre numéro burkinabè pour recevoir un code de connexion par
          SMS.
        </p>
        <form action={formAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-dark" htmlFor="phone">
            Numéro de téléphone
          </label>
          <input
            id="phone"
            name="phone"
            inputMode="tel"
            placeholder="+22670123456"
            className="h-12 w-full rounded-btn border border-border bg-white px-4 text-dark outline-none focus:border-primary"
          />
          <SubmitButton />
          {state.message ? (
            <p
              className={`text-sm font-medium ${
                state.ok ? "text-wa-green" : "text-primary"
              }`}
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
