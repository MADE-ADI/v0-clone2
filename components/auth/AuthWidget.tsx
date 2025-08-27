"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthWidget() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center gap-1 lg:gap-2">
      {!session?.user ? (
        <Button size="sm" variant="outline" className="text-xs lg:text-sm px-2 lg:px-3" onClick={() => signIn("google")}>
          <span className="hidden sm:inline">Continue with </span>Google
        </Button>
      ) : (
        <>
          <div className="text-xs text-muted-foreground hidden md:block max-w-[120px] lg:max-w-none truncate">
            Hi, {session.user.name || session.user.email}
          </div>
          <Button size="sm" variant="ghost" className="text-xs lg:text-sm px-2 lg:px-3" onClick={() => signOut({ redirect: false })}>
            Sign out
          </Button>
        </>
      )}
    </div>
  );
}
