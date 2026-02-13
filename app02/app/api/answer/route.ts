export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAnswer, normalizeAnswer } from "@/lib/answer";

type Body = {
  questId: string;
  stepOrder: number;
  answer: string;
  gameSessionId?: string;
};

export function GET() {
  return NextResponse.json({
    ok: true,
    info: "POST { questId, stepOrder, answer, gameSessionId? }",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>;

    const questId = body.questId;
    const stepOrder = body.stepOrder;
    const answer = body.answer;
    const gameSessionId = body.gameSessionId;

    // 0) Валидация
    if (!questId || typeof questId !== "string") {
      return NextResponse.json({ ok: false, error: "questId is required" }, { status: 400 });
    }
    if (!Number.isInteger(stepOrder) || (stepOrder as number) < 1) {
      return NextResponse.json(
        { ok: false, error: "stepOrder must be integer >= 1" },
        { status: 400 }
      );
    }
    if (typeof answer !== "string" || answer.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "answer is required" }, { status: 400 });
    }

    // 1) Step
    const step = await prisma.step.findFirst({
      where: { questId, order: stepOrder as number },
      select: { id: true, prompt: true, answerHash: true, hint: true },
    });

    if (!step) {
      return NextResponse.json({ ok: false, error: "Step not found" }, { status: 404 });
    }

    // 2) GameSession (создаём, если нет)
    const session = gameSessionId
      ? await prisma.gameSession.findUnique({
          where: { id: gameSessionId },
          select: { id: true, questId: true },
        })
      : await prisma.gameSession.create({
          data: { questId, status: "ACTIVE" },
          select: { id: true, questId: true },
        });

    if (!session) {
      return NextResponse.json({ ok: false, error: "GameSession not found" }, { status: 404 });
    }
    if (session.questId !== questId) {
      return NextResponse.json(
        { ok: false, error: "GameSession belongs to another quest" },
        { status: 400 }
      );
    }

    // 3) Проверка ответа
    const isCorrect = checkAnswer(answer, step.answerHash);

    // 4) Attempt
    await prisma.attempt.create({
      data: {
        gameSessionId: session.id,
        stepId: step.id,
        answer: normalizeAnswer(answer),
        isCorrect,
      },
    });

    return NextResponse.json({
      ok: true,
      isCorrect,
      gameSessionId: session.id,
      step: { order: stepOrder, prompt: step.prompt },
      hint: isCorrect ? null : step.hint ?? null,
    });
  } catch (e) {
    // Главное: если что-то пойдёт не так, ты увидишь реальную ошибку, а не загадочный 404
    console.error("API /api/answer error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error", details: String(e) },
      { status: 500 }
    );
  }
}


