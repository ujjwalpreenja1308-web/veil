import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-primary">Veil</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          AI Agent Observability. One line of code.
          <br />
          Detect, classify, and alert on agent failures.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
