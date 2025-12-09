"use client";
import React from "react";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function SignOutModal({ open, onOpenChange }: Props) {
  const [loading, setLoading] = React.useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await fetch("/api/organization/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore
    }
    const callback = `${window.location.origin}/auth_userPro/login`;
    await signOut({ callbackUrl: callback });
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cerrar sesión?</DialogTitle>
          <DialogDescription>
            Si cierras sesión perderás el acceso a la organización hasta que
            vuelvas a iniciar sesión.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Cerrando..." : "Cerrar sesión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
