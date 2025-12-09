"use client";
import React from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type Props = {
  redirectUrl?: string;
};

export default function SignOutMenu({
  redirectUrl = "/auth_userPro/login",
}: Props) {
  const [loading, setLoading] = React.useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      // First clear legacy cookies via our API (so server-side checks stop failing)
      await fetch("/api/organization/auth/signout", {
        method: "POST",
        credentials: "include",
      });

      // Then call NextAuth signOut which will also invalidate the session and redirect
      const callback = `${window.location.origin}${redirectUrl}`;
      await signOut({ callbackUrl: callback });
    } catch (err) {
      console.error("signOut error", err);
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSignOut}
        disabled={loading}
      >
        {loading ? "Cerrando sesión..." : "Cerrar sesión"}
      </Button>
    </div>
  );
}
