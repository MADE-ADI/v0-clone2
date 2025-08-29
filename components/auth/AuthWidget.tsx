"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthWidget() {
  useSession();

  return (
    <div className="flex items-center gap-1 lg:gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-xs lg:text-sm px-2 lg:px-3"
        onClick={() => signIn("google")}
      >
        Sign in
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-xs lg:text-sm px-2 lg:px-3"
        onClick={() => signOut({ redirect: false })}
      >
        Sign out
      </Button>
    </div>
  );
}
