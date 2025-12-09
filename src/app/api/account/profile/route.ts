import { NextResponse } from "next/server";

// Endpoint legacy de la app antigua (nomeal). En esta app PRO no se usa
// y lo dejamos desactivado para que no rompa el dashboard.

export async function GET() {
  return NextResponse.json(
    { error: "Perfil legacy no disponible en esta aplicación" },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Perfil legacy no disponible en esta aplicación" },
    { status: 410 }
  );
}
