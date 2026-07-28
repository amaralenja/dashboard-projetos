import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data";
import { Withdrawal } from "@/lib/types";

export async function GET() {
  const data = readData();
  return NextResponse.json(data.withdrawals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  const withdrawal: Withdrawal = {
    id: `wdl-${Date.now()}`,
    date: body.date || new Date().toISOString().split("T")[0],
    amount: body.amount || 0,
    createdAt: new Date().toISOString(),
  };

  data.withdrawals.push(withdrawal);
  writeData(data);

  return NextResponse.json(withdrawal, { status: 201 });
}
