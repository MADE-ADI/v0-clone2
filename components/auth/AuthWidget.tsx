"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthWidget() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center gap-1 lg:gap-2">
      {!session?.user ? (
        <Button
          size="sm"
          variant="outline"
          className="text-xs lg:text-sm px-2 lg:px-3"
          onClick={() => signIn("google")}
        >
          Sign in
        </Button>
      ) : (
        <>
          <span className="text-xs lg:text-sm text-muted-foreground truncate max-w-[100px] lg:max-w-[150px]">
            {session.user.name || session.user.email}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs lg:text-sm px-2 lg:px-3"
            onClick={() => signOut({ redirect: false })}
          >
            Sign out
          </Button>
        </>
      )}
    </div>
  );
}
