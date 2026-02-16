import { FormEvent } from "react";
import { Locale, t } from "@/lib/i18n";

interface AuthFormProps {
  locale: Locale;
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
  loginName: string;
  setLoginName: (value: string) => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  authError: string;
  onSubmit: (e: FormEvent) => void;
}

export function AuthForm({
  locale,
  authMode,
  setAuthMode,
  loginName,
  setLoginName,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  authError,
  onSubmit,
}: AuthFormProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-3">{t(locale, "privateAccess")}</h1>
        <p className="text-sm text-slate-600 mb-4">{t(locale, "privateAccessDescription")}</p>
        <div className="flex gap-2 mb-3 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`px-3 py-1 rounded text-sm flex-1 ${authMode === "login" ? "bg-blue-500 text-white" : "bg-transparent"}`}
          >
            {t(locale, "login")}
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("register")}
            className={`px-3 py-1 rounded text-sm flex-1 ${authMode === "register" ? "bg-blue-500 text-white" : "bg-transparent"}`}
          >
            {t(locale, "register")}
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          {authMode === "register" && (
            <input
              type="text"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder={t(locale, "yourName")}
              required
              minLength={2}
            />
          )}
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder={t(locale, "email")}
            required
          />
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder={t(locale, "password")}
            required
            minLength={6}
          />
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            {authMode === "login" ? t(locale, "login") : t(locale, "register")}
          </button>
        </form>
      </div>
    </div>
  );
}
