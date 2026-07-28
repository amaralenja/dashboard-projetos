import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { readData } from "@/lib/data";
import { Withdrawal } from "@/lib/types";

export async function GET() {
  const data = await readData();
  return NextResponse.json(data.withdrawals);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const body = await req.json();

  const withdrawal: Withdrawal = {
    id: `wdl-${Date.now()}`,
    date: body.date || new Date().toISOString().split("T")[0],
    amount: body.amount || 0,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("withdrawals").insert({
    id: withdrawal.id,
    date: withdrawal.date,
    amount: withdrawal.amount,
    created_at: withdrawal.createdAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(withdrawal, { status: 201 });
}
