import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { projectId, commission } = body;
  const data = readData();

  const index = data.projects.findIndex((p) => p.id === projectId);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const value = typeof commission === "number" ? commission : null;
  const oldCommission = data.projects[index].commission;

  data.projects[index].commission = value;

  if (value !== null && value !== oldCommission) {
    data.projects[index].history.push({
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      type: "commission",
      description: `Comissão de R$ ${value.toFixed(2)} registrada`,
    });
  }

  writeData(data);

  return NextResponse.json(data.projects[index]);
}
