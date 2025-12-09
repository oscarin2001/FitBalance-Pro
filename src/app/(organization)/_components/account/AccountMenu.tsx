"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import Avatar from "./Avatar";
import { Star, Layout, Settings, HelpCircle, LogOut } from "lucide-react";
// Button intentionally not used here to avoid primary-blue styles
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import SignOutModal from "./SignOutModal";

type Props = {
  compact?: boolean;
};

export default function AccountMenu({ compact = false }: Props) {
  const { data: session } = useSession();

  const name = session?.user?.name ?? session?.user?.email ?? "Usuario";

  // use Radix DropdownMenu for proper theming and behavior
  const [showSignOut, setShowSignOut] = React.useState(false);

  return (
    <div className="relative flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={name}
            className="w-10 h-10 rounded-full bg-transparent p-0"
          >
            <Avatar name={name} size={36} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          className="w-64 bg-white text-slate-900 rounded-md overflow-hidden"
        >
          <DropdownMenuItem className="hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 text-slate-300" />
              <span>Plan de actualización</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <Layout className="h-4 w-4 text-slate-300" />
              <span>Personalización</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 text-slate-300" />
              <span>Configuración</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-slate-50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-slate-300" />
                <span>Ayuda</span>
              </div>
              <span className="text-xs text-slate-400">›</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="hover:bg-slate-50"
            onSelect={() => setShowSignOut(true)}
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-slate-300" />
              <span>Cerrar sesión</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
        <SignOutModal open={showSignOut} onOpenChange={setShowSignOut} />
      </DropdownMenu>

      {/* Profile summary shown inline beside avatar when not compact */}
      {!compact && (
        <div className="flex items-center justify-between w-full max-w-xs">
          <div className="flex flex-col ml-1">
            <span className="text-sm font-medium text-slate-900">{name}</span>
            <span className="text-xs text-slate-500">Gratis</span>
          </div>

          <div>
            <button
              type="button"
              className="px-3 py-1 rounded bg-white text-slate-900 border shadow-sm"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
