"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ALLOWED_INTERVALS = [1, 2, 3, 4] as const;
const DEFAULT_INTERVAL = 2;

type IntervalValue = (typeof ALLOWED_INTERVALS)[number];

type IntervalOption = {
	value: IntervalValue;
	label: string;
	description: string;
	tip: string;
};

const OPTIONS: IntervalOption[] = [
	{
		value: 1,
		label: "Cada semana",
		description: "Control estricto para fases de corte agresivo o atletas con objetivos puntuales.",
		tip: "Procura medir siempre a la misma hora y con condiciones similares para reducir ruido.",
	},
	{
		value: 2,
		label: "Cada 2 semanas (recomendado)",
		description: "Balance ideal entre consistencia y tiempo invertido. Es la opción predeterminada del dashboard.",
		tip: "Perfecto para recomposición y procesos de pérdida de grasa moderada.",
	},
	{
		value: 3,
		label: "Cada 3 semanas",
		description: "Para etapas largas o cuando prefieres menos interrupciones en tu rutina semanal.",
		tip: "Úsalo en temporadas con carga laboral alta; apóyate en fotos y notas.",
	},
	{
		value: 4,
		label: "Cada 4 semanas",
		description: "Seguimiento mensual clásico para mantenimiento o fases de volumen controlado.",
		tip: "Complementa con registro de energía, sueño y apetito para un contexto completo.",
	},
];

function parseDateOnly(value: string | null | undefined) {
	if (!value || typeof value !== "string") return null;
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(isoDate: string) {
	const parsed = parseDateOnly(isoDate);
	if (!parsed) return isoDate;
	try {
		const formatter = new Intl.DateTimeFormat("es-ES", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
		return formatter.format(parsed);
	} catch {
		return isoDate;
	}
}

export default function ProfileProgressPreferencesPage() {
	const [currentInterval, setCurrentInterval] = useState<IntervalValue>(DEFAULT_INTERVAL);
	const [initialInterval, setInitialInterval] = useState<IntervalValue>(DEFAULT_INTERVAL);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [lastMeasurementDate, setLastMeasurementDate] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const [intervalRes, latestProgressRes] = await Promise.all([
					fetch("/api/account/profile/measurement-interval", { cache: "no-store" }),
					fetch("/api/account/progress?limit=1", { cache: "no-store" }),
				]);

				if (ignore) return;

				if (intervalRes.ok) {
					const data = await intervalRes.json();
					const weeks = Number(data?.weeks);
					if (ALLOWED_INTERVALS.includes(weeks as IntervalValue)) {
						setCurrentInterval(weeks as IntervalValue);
						setInitialInterval(weeks as IntervalValue);
					}
				}

				if (latestProgressRes.ok) {
					const data = await latestProgressRes.json();
					const last = Array.isArray(data?.items) ? data.items[0] : null;
					const nextDate = parseDateOnly(last?.fecha);
					setLastMeasurementDate(nextDate ? nextDate.toISOString().slice(0, 10) : null);
				}
			} catch {
				if (!ignore) {
					setError("No pudimos cargar la configuración de mediciones. Intenta nuevamente.");
				}
			} finally {
				if (!ignore) setLoading(false);
			}
		})();

		return () => {
			ignore = true;
		};
	}, []);

	const previewDates = useMemo(() => {
		const parsedAnchor = parseDateOnly(lastMeasurementDate);
		const anchor = parsedAnchor ?? new Date();
		const normalized = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
		if (Number.isNaN(normalized.getTime())) return [];
		const weeks = currentInterval || DEFAULT_INTERVAL;
		const dates: string[] = [];
		for (let i = 1; i <= 4; i++) {
			const copy = new Date(normalized);
			copy.setDate(copy.getDate() + i * weeks * 7);
			if (!Number.isNaN(copy.getTime())) {
				dates.push(copy.toISOString().slice(0, 10));
			}
		}
		return dates;
	}, [currentInterval, lastMeasurementDate]);

	const selectedOption = OPTIONS.find((opt) => opt.value === currentInterval);
	const dirty = currentInterval !== initialInterval;

	async function handleSave() {
		try {
			setSaving(true);
			setError(null);
			setSuccess(null);
			const res = await fetch("/api/account/profile/measurement-interval", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ weeks: currentInterval }),
			});
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(payload?.error || "No se pudo guardar la preferencia");
			}
			setInitialInterval(currentInterval);
			setSuccess("Listo. El dashboard de progreso usará esta frecuencia.");
		} catch (err: any) {
			setError(err?.message || "No se pudo guardar la preferencia");
		} finally {
			setSaving(false);
		}
	}

	function handleReset() {
		setCurrentInterval(initialInterval);
		setError(null);
		setSuccess(null);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Cadencia de mediciones</h1>
				<p className="text-sm text-muted-foreground">
					Define cada cuántas semanas quieres registrar tus controles físicos. Esta preferencia alimenta el calendario del dashboard y las
					validaciones del formulario de progreso.
				</p>
			</div>

			{error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
			{success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

			<Card>
				<CardHeader>
					<CardTitle>Frecuencia preferida</CardTitle>
					<CardDescription>Selecciona el intervalo que mejor acompaña tu fase actual.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{OPTIONS.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => !loading && !saving && setCurrentInterval(option.value)}
							className={cn(
								"w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								option.value === currentInterval ? "border-primary bg-primary/5" : "border-muted hover:border-primary/60",
								(loading || saving) && "pointer-events-none opacity-60"
							)}
							aria-pressed={option.value === currentInterval}
						>
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="font-semibold">{option.label}</p>
									<p className="text-sm text-muted-foreground">{option.description}</p>
								</div>
								{option.value === currentInterval && <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />}
							</div>
							<p className="mt-3 text-xs text-muted-foreground">{option.tip}</p>
						</button>
					))}
				</CardContent>
				<CardFooter className="flex flex-wrap items-center gap-2 justify-between">
					<p className="text-xs text-muted-foreground flex items-center gap-1">
						<Info className="h-3.5 w-3.5" /> Podrás editar mediciones puntuales desde el calendario del dashboard.
					</p>
					<div className="flex gap-2">
						<Button type="button" variant="ghost" disabled={!dirty || saving} onClick={handleReset}>
							Revertir
						</Button>
						<Button type="button" disabled={!dirty || saving} onClick={handleSave}>
							{saving ? "Guardando..." : "Guardar"}
						</Button>
					</div>
				</CardFooter>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Vista previa</CardTitle>
					<CardDescription>
						Tomamos tu última medición como ancla para sugerir las siguientes fechas. Las verás reflejadas en el
						<Link href="/dashboard/progress" className="ml-1 underline underline-offset-2">
							dashboard de progreso
						</Link>
						.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-md border bg-muted/40 p-3 text-sm">
						{lastMeasurementDate ? (
							<>
								<p className="font-medium text-foreground">Última medición registrada: {formatDate(lastMeasurementDate)}</p>
								<p className="text-muted-foreground">
									Esa fecha servirá como punto de partida para tus próximos recordatorios cada {currentInterval} semana(s).
								</p>
							</>
						) : (
							<>
								<p className="font-medium text-foreground">Todavía no registras mediciones</p>
								<p className="text-muted-foreground">Usaremos el día de hoy como referencia hasta que cargues tu primer control.</p>
							</>
						)}
					</div>

					<div className="space-y-2">
						<p className="text-sm font-semibold flex items-center gap-2">
							<CalendarDays className="h-4 w-4" /> Próximas cuatro fechas sugeridas
						</p>
						<div className="grid gap-3 sm:grid-cols-2">
							{previewDates.map((date, index) => (
								<div key={date} className="rounded-lg border p-3">
									<p className="text-sm font-semibold">{formatDate(date)}</p>
									<p className="text-xs text-muted-foreground">{index === 0 ? "Próximo control" : `${index + 1}. recordatorio`}</p>
								</div>
							))}
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex flex-wrap items-center gap-2 justify-between">
					<p className="text-xs text-muted-foreground">
						{selectedOption ? `Consejo: ${selectedOption.tip}` : "Selecciona un intervalo para ver recomendaciones."}
					</p>
					<Button asChild variant="secondary">
						<Link href="/dashboard/progress">Abrir dashboard</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
