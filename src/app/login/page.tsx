import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="sr-only">Backstage</h1>
        <Image
          src="/backstage-logo.png"
          alt=""
          width={160}
          height={160}
          className="mx-auto mb-4 rounded-2xl"
          priority
        />
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Sign in with the account your department created for you.
        </p>
        <LoginForm callbackUrl={callbackUrl ?? "/"} />
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Forgot your password? Contact your fine arts admin — they can
          reset it for you in Settings.
        </p>
      </div>
    </div>
  );
}
