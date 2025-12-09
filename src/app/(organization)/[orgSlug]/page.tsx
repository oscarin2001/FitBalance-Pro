import { OrgPageHeader } from "../_components/org-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Bell,
  Brain,
  LineChart,
  MapPin,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

const KPI_CARDS = [
  { label: "Coaches activos", value: "12", trend: "+2 vs. mes anterior" },
  { label: "Usuarios premium", value: "326", trend: "+18 altas esta semana" },
  { label: "Cumplimiento diario", value: "82%", trend: "+6% sobre proyeccion" },
  { label: "Tickets abiertos", value: "9", trend: "3 requieren escalamiento" },
  { label: "SLA respuestas", value: "42 min", trend: "Objetivo 45 min" },
  { label: "Ingresos MRR", value: "$48.2K", trend: "+12% MoM" },
];

const PERFORMANCE_SERIES = [72, 80, 76, 90, 88, 94, 97, 92];
const PERFORMANCE_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
];

const COACH_RANKING = [
  {
    coach: "Laura Medina",
    score: 97,
    winRate: "68% cierres",
    load: "28 usuarios",
  },
  {
    coach: "Diego Ortega",
    score: 92,
    winRate: "4.7/5 NPS",
    load: "24 usuarios",
  },
  {
    coach: "Rafa Silva",
    score: 88,
    winRate: "62% cierres",
    load: "18 usuarios",
  },
  {
    coach: "Nuria Fabre",
    score: 85,
    winRate: "3.9/5 NPS",
    load: "21 usuarios",
  },
];

const DISTRIBUTION = [
  { label: "Metabolico", value: 42 },
  { label: "Corporativo", value: 28 },
  { label: "Alto rendimiento", value: 19 },
  { label: "Recuperacion", value: 11 },
];

const ACTIVITY_LOG = [
  {
    user: "Ana G.",
    action: "Sincronizo glucosa continua",
    coach: "Laura",
    time: "Hoy · 09:32",
    status: "Estable",
  },
  {
    user: "Club Orion",
    action: "Plan de hidratacion aprobado",
    coach: "Rafa",
    time: "Hoy · 08:05",
    status: "Listo",
  },
  {
    user: "Marcus P.",
    action: "Carga de fuerza 78%",
    coach: "Diego",
    time: "Ayer · 22:16",
    status: "Atento",
  },
  {
    user: "Lab Vitae",
    action: "Laboratorios cargados",
    coach: "Nuria",
    time: "Ayer · 17:44",
    status: "Completo",
  },
];

const AI_INSIGHTS = [
  {
    title: "Carga distribuida",
    detail:
      "Los squads Norte y Caribe concentran 61% de tickets. Reasigna 2 coaches a zonas Centro.",
    impact: "+12 pts SLA",
  },
  {
    title: "Retencion premium",
    detail:
      "Clientes empresariales con planes > 18k mantienen 96% de adherencia. Sugerido duplicar bundle ejecutivo.",
    impact: "+8 pts NRR",
  },
];

const ALERTS = [
  {
    title: "Falta de hidratacion",
    detail: "24 usuarios sin registro en 48h",
    level: "Alto",
  },
  {
    title: "Carga cardiovascular",
    detail: "3 atletas con HRV por debajo del umbral",
    level: "Medio",
  },
  {
    title: "Pagos corporativos",
    detail: "2 facturas vencen en 72h",
    level: "Medio",
  },
];

const LOAD_STATUS = [
  { coach: "Diego Ortega", load: 0.82, tags: "Alto" },
  { coach: "Laura Medina", load: 0.64, tags: "Balanceado" },
  { coach: "Nuria Fabre", load: 0.58, tags: "Reserva" },
];

const HEALTH_ZONES = [
  { zone: "Norte", hydration: 86, recovery: 74, risk: "Bajo" },
  { zone: "Centro", hydration: 78, recovery: 69, risk: "Vigilar" },
  { zone: "Caribe", hydration: 91, recovery: 82, risk: "Optimo" },
  { zone: "Sur", hydration: 67, recovery: 58, risk: "Alerta" },
];

export default function OrganizationDashboardPage() {
  const chartPath = PERFORMANCE_SERIES.map((value, index) => {
    const x = (index / (PERFORMANCE_SERIES.length - 1)) * 100;
    const y = 100 - value;
    return `${index === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-8">
      <OrgPageHeader
        title="Control global"
        description="Panel ejecutivo enfocado en operaciones, salud financiera y riesgos del espacio."
        actions={<Button variant="outline">Exportar paquetizado</Button>}
      />

      <Card className="border-none bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-md">
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              FitBalance Latam
            </p>
            <h2 className="text-2xl font-semibold">
              Helios Performance Collective
            </h2>
            <p className="text-sm text-muted-foreground">
              4 escuadras · 38 coaches · 326 usuarios premium · SLA global 42
              min
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="icon" variant="secondary">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" /> Añadir coach
            </Button>
            <div className="flex items-center gap-3 rounded-full border px-3 py-1">
              <div className="h-8 w-8 rounded-full bg-primary/20 text-center text-sm font-semibold leading-8">
                AC
              </div>
              <div>
                <p className="text-sm font-medium">Andrea Cueto</p>
                <p className="text-xs text-muted-foreground">Super admin</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {KPI_CARDS.map((stat) => (
          <Card key={stat.label} className="border-border/70">
            <CardHeader className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
              <p className="text-xs text-emerald-600">{stat.trend}</p>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Usuarios comprometidos</CardTitle>
              <CardDescription>
                Actividad multicanal y conversiones por semana.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LineChart className="h-4 w-4" /> Serie de 8 semanas
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative h-64 w-full">
              <svg viewBox="0 0 100 100" className="h-full w-full text-primary">
                <defs>
                  <linearGradient id="trend" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity="0.35"
                    />
                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <path
                  d={`${chartPath} L100,100 L0,100 Z`}
                  fill="url(#trend)"
                  stroke="none"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={chartPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="pointer-events-none absolute inset-0 flex items-end justify-between px-4 text-[10px] text-muted-foreground">
                {PERFORMANCE_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Conversion global
                </p>
                <p className="text-2xl font-semibold">34%</p>
                <p className="text-xs text-emerald-600">+4 pts vs. promedio</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Usuarios que escalan
                </p>
                <p className="text-2xl font-semibold">58</p>
                <p className="text-xs text-orange-600">11 con riesgo</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Valor proyectado
                </p>
                <p className="text-2xl font-semibold">$182K</p>
                <p className="text-xs text-muted-foreground">Cierre 45 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4" /> Copiloto IA
            </CardTitle>
            <CardDescription>
              Observaciones accionables generadas hoy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {AI_INSIGHTS.map((insight) => (
              <div
                key={insight.title}
                className="rounded-xl border border-dashed border-border/60 p-4"
              >
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="text-sm text-muted-foreground">
                  {insight.detail}
                </p>
                <p className="mt-2 text-xs text-emerald-600">
                  Impacto estimado {insight.impact}
                </p>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button size="sm" className="w-full" variant="secondary">
              Aplicar recomendaciones
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Ranking de coaches
            </CardTitle>
            <CardDescription>
              Score operacional ponderado por NRR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {COACH_RANKING.map((coach, index) => (
              <div
                key={coach.coach}
                className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-semibold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{coach.coach}</p>
                    <p className="text-xs text-muted-foreground">
                      {coach.winRate}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{coach.score}</p>
                  <p className="text-xs text-muted-foreground">{coach.load}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Distribucion de usuarios
            </CardTitle>
            <CardDescription>Participacion por portafolio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DISTRIBUTION.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <p>{item.label}</p>
                  <p className="text-muted-foreground">{item.value}%</p>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Mapa de salud global
            </CardTitle>
            <CardDescription>Indicadores por zona operativa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {HEALTH_ZONES.map((zone) => (
              <div
                key={zone.zone}
                className="rounded-xl border border-border/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{zone.zone}</p>
                  <span className="text-xs text-muted-foreground">
                    Riesgo {zone.risk}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Hidratacion</p>
                    <p className="font-semibold">{zone.hydration}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recuperacion</p>
                    <p className="font-semibold">{zone.recovery}%</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Ultimas actividades</CardTitle>
            <CardDescription>
              Sincronizaciones, planes aprobados y alertas cerradas.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Buscar equipo o usuario" className="w-48" />
            <Button variant="outline" size="sm">
              Filtrar periodo
            </Button>
            <Button size="sm">Exportar CSV</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-5 rounded-lg bg-muted/40 px-4 py-2 font-medium uppercase tracking-wide text-[11px] text-muted-foreground">
            <span>Entidad</span>
            <span>Movimiento</span>
            <span>Coach</span>
            <span>Estado</span>
            <span>Tiempo</span>
          </div>
          {ACTIVITY_LOG.map((activity) => (
            <div
              key={activity.user}
              className="grid grid-cols-5 items-center rounded-xl border border-border/70 px-4 py-3"
            >
              <p className="font-medium">{activity.user}</p>
              <p className="text-muted-foreground">{activity.action}</p>
              <p>{activity.coach}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-center text-xs text-emerald-600">
                {activity.status}
              </span>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Estado de carga
            </CardTitle>
            <CardDescription>
              Balance de usuarios por coach senior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {LOAD_STATUS.map((item) => (
              <div
                key={item.coach}
                className="space-y-2 rounded-xl border border-border/60 p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium">{item.coach}</p>
                  <span className="text-xs text-muted-foreground">
                    {item.tags}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      item.load > 0.75 ? "bg-orange-500" : "bg-primary"
                    }`}
                    style={{ width: `${item.load * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(item.load * 100)}% de cupo ocupado
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Sistema de alertas
            </CardTitle>
            <CardDescription>
              Prioridad automatica segun impacto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ALERTS.map((alert) => (
              <div
                key={alert.title}
                className="rounded-xl border border-border/60 p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium">{alert.title}</p>
                  <span
                    className={`text-xs ${
                      alert.level === "Alto"
                        ? "text-red-600"
                        : "text-orange-600"
                    }`}
                  >
                    {alert.level}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{alert.detail}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="outline" className="w-full">
              Ver playbooks
            </Button>
          </CardFooter>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Perfil de la organizacion
            </CardTitle>
            <CardDescription>Contexto ejecutivo para socios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Sector</p>
              <p className="font-medium">Programas metabolicos B2B</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Contrato vigente</p>
              <p className="font-medium">USD 520K · 12 meses restantes</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Escuadras</p>
              <p className="font-medium">Norte, Centro, Caribe, Elite</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Operaciones criticas</p>
              <p className="font-medium">
                Laboratorios Helios · Clinicas VidaLoop
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
