"use client";
import * as React from "react";
// account menu removed from sidebar per user request
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Users,
  UserRoundCog,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import Avatar from "./account/Avatar";
import AccountMenu from "./account/AccountMenu";
type OrgNavItem = {
  title: string;
  description?: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

type OrgNavGroup = {
  title: string;
  items: OrgNavItem[];
};

const NAV_GROUPS: OrgNavGroup[] = [
  {
    title: "Panorama",
    items: [
      {
        title: "Centro de mando",
        description: "Pulso de KPIs y movimiento reciente",
        path: "",
        icon: LayoutDashboard,
      },
      {
        title: "Dashboard organización",
        description: "Visión operativa del gimnasio / equipo",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Control global",
        description: "KPIs y visión global de la red",
        path: "/control",
        icon: Activity,
      },
      {
        title: "Auditoría",
        description: "Logs y compliance",
        path: "/audit",
        icon: ShieldCheck,
      },
      {
        title: "IA Predictiva",
        description: "Señales y predicciones de clientes",
        path: "/ai",
        icon: Activity,
      },
      {
        title: "Finanzas",
        description: "Dashboard financiero: organización y profesionales",
        path: "/finance",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Operaciones",
    items: [
      {
        title: "Clientes",
        description: "Programas, cohortes y compromisos",
        path: "/clients",
        icon: Users,
      },
      {
        title: "Miembros",
        description: "Equipo del espacio e invitaciones",
        path: "/members",
        icon: UserRoundCog,
      },
      {
        title: "Sucursales",
        description: "Ubicaciones físicas y capacidad",
        path: "/branches",
        icon: Activity,
      },
      {
        title: "Encargados",
        description: "Asignar encargados por sucursal",
        path: "/branches/managers",
        icon: UserRoundCog,
      },
      {
        title: "Agregar Coach",
        description: "Agregar nuevo coach al equipo",
        path: "/professionals/coach/create",
        icon: UserRoundCog,
      },
      {
        title: "Agregar Nutricionista",
        description: "Agregar nuevo nutricionista al equipo",
        path: "/professionals/nutritionist/create",
        icon: UserRoundCog,
      },
    ],
  },
  {
    title: "Gobernanza",
    items: [
      {
        title: "Roles y accesos",
        description: "Politicas y salvaguardas",
        path: "/roles",
        icon: ShieldCheck,
      },
      {
        title: "Ajustes",
        description: "Marca, facturacion y avisos",
        path: "/settings",
        icon: Settings2,
      },
    ],
  },
];

export function OrgSidebar() {
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const pathname = usePathname();
  const { data: session } = useSession();
  const basePath = orgSlug ? `/${orgSlug}` : "/";
  const orgLabel = orgSlug
    ? orgSlug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Organizacion";

  return (
    <Sidebar>
      <SidebarHeader className="gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Espacio de trabajo
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Activity className="size-4 text-muted-foreground" />
            <span>{orgLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Orquesta programas, talento y operaciones desde un solo tablero.
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const href = `${basePath}${item.path}`;
                  const isActive =
                    item.path === ""
                      ? pathname === basePath
                      : pathname.startsWith(href);
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={href}>
                          <Icon className="size-4" aria-hidden />
                          <span className="flex flex-col text-left">
                            {item.title}
                            {item.description ? (
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {/* Invite / share buttons removed per request */}
        <div className="mt-3">
          <AccountMenu />
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Tip: usa{" "}
          <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold">
            ⌘/Ctrl
          </kbd>
          <span className="px-1">+</span>
          <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold">
            B
          </kbd>{" "}
          para contraer la barra.
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
