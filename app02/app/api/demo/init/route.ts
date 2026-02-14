export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashAnswer, normalizeAnswer } from "@/lib/answer";

/**
 * POST /api/demo/init
 * Создаёт 1 Quest + 1 Step (order=1) с answerHash.
 * Если такой Quest уже есть (по title), просто возвращает его.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      prompt?: string;
      answer?: string;
      hint?: string | null;
    };

    const title = body.title?.trim() || "Demo Quest";
    const prompt = body.prompt?.trim() || "Как называется главная пешеходная улица вашего города?";
    const answer = body.answer?.trim() || "ленина"; // поменяй на свой демо-ответ
    const hint = body.hint ?? "Подсказка: часто это центральная улица.";

    // 1) Ищем существующий демо-квест по title
    const existing = await prisma.quest.findFirst({
      where: { title },
      select: { id: true },
    });

    if (existing) {
      // убедимся, что шаг 1 существует
      const step1 = await prisma.step.findFirst({
        where: { questId: existing.id, order: 1 },
        select: { id: true, prompt: true },
      });

      return NextResponse.json({
        ok: true,
        created: false,
        questId: existing.id,
        step1,
      });
    }

    // 2) Создаём Quest + Step атомарно
    const normalized = normalizeAnswer(answer);
    const answerHash = hashAnswer(normalized);

    const created = await prisma.quest.create({
      data: {
        title,
        isActive: true,
        steps: {
          create: {
            order: 1,
            prompt,
            answerHash,
            hint: hint || null,
          },
        },
      },
      select: {
        id: true,
        title: true,
        steps: { select: { id: true, order: true, prompt: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      created: true,
      quest: created,
      // чтобы ты могла сразу тестировать /api/answer:
      info: { questId: created.id, stepOrder: 1 },
    });
  } catch (e) {
    console.error("POST /api/demo/init error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error", details: String(e) },
      { status: 500 }
    );
  }
}
