"use client";

import { useMemo, useState } from "react";
import styles from "./Demo.module.css";

type InitOk = {
  ok: true;
  created: boolean;
  quest?: { id: string; title: string; steps?: Array<{ id: string; order: number; prompt: string }> };
  questId?: string;
  step1?: { id: string; prompt: string } | null;
  info?: { questId: string; stepOrder: number };
};

type InitErr = { ok: false; error: string; details?: string };

type InitResponse = InitOk | InitErr;

type AnswerOk = {
  ok: true;
  isCorrect: boolean;
  gameSessionId: string;
  step: { order: number; prompt: string };
  hint: string | null;
};

type AnswerErr = { ok: false; error: string; details?: string };

type AnswerResponse = AnswerOk | AnswerErr;

export default function DemoPage() {
  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const [questId, setQuestId] = useState<string | null>(null);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const [status, setStatus] = useState<null | { kind: "ok" | "bad"; message: string }>(null);

  const canSubmit = useMemo(() => {
    return !!questId && answer.trim().length > 0 && !loadingAnswer;
  }, [questId, answer, loadingAnswer]);

  async function initDemo() {
    setLoadingInit(true);
    setStatus(null);
    setHint(null);
    setGameSessionId(null);
    setAnswer("");

    try {
      const res = await fetch("/api/demo/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Demo Quest",
          prompt: "Сколько будет 2+2?",
          answer: "4",
          hint: "Подсказка: это число после 3",
        }),
      });

      const data: InitResponse = await res.json();

      if (!data.ok) {
        setStatus({ kind: "bad", message: data.error ?? "Init failed" });
        return;
      }

      // questId может прийти либо в info.questId, либо questId (если уже существовал), либо quest.id
      const qid = data.info?.questId ?? data.questId ?? data.quest?.id ?? null;
      setQuestId(qid);

      // prompt может быть в created quest.steps[0] или step1
      const p =
        data.quest?.steps?.find((s) => s.order === 1)?.prompt ??
        data.step1?.prompt ??
        "Вопрос создан, но prompt не пришёл";
      setPrompt(p);

      setStatus({
        kind: "ok",
        message: data.created ? "Демо-квест создан ✅" : "Демо-квест уже был, используем его ✅",
      });
    } catch {
      setStatus({ kind: "bad", message: "Ошибка сети/сервера при инициализации" });
    } finally {
      setLoadingInit(false);
    }
  }

  async function submitAnswer() {
    if (!questId) return;

    setLoadingAnswer(true);
    setStatus(null);
    setHint(null);

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId,
          stepOrder: 1,
          answer,
          gameSessionId: gameSessionId ?? undefined,
        }),
      });

      const data: AnswerResponse = await res.json();

      if (!data.ok) {
        setStatus({ kind: "bad", message: data.error ?? "Answer failed" });
        return;
      }

      setGameSessionId(data.gameSessionId);
      setPrompt(data.step.prompt);
      setHint(data.hint);

      setStatus(
        data.isCorrect
          ? { kind: "ok", message: "Верно! Задание пройдено ✅" }
          : { kind: "bad", message: "Неверно. Попробуй ещё раз 🙃" }
      );
    } catch {
      setStatus({ kind: "bad", message: "Ошибка сети/сервера при отправке ответа" });
    } finally {
      setLoadingAnswer(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.h1}>Демо: квест-вопрос</h1>
          <p className={styles.sub}>Минимальный прототип: создать квест → ответить на вопрос → получить результат.</p>
        </header>

        <section className={styles.card}>
          <button
            onClick={initDemo}
            disabled={loadingInit}
            className={[styles.btn, loadingInit ? styles.btnPrimaryDisabled : styles.btnPrimary].join(" ")}
          >
            {loadingInit ? "Создаю демо-квест…" : "Создать демо-квест"}
          </button>

          <div className={styles.sp14} />

          <div className={styles.promptBox}>
            <div className={styles.promptLabel}>Вопрос</div>
            <div className={styles.promptText}>{prompt ?? "Нажми “Создать демо-квест”, чтобы получить вопрос"}</div>
          </div>

          <div className={styles.sp14} />

          <label className={styles.label}>Твой ответ</label>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Введи ответ…"
            inputMode="text"
            className={styles.input}
          />

          <div className={styles.sp12} />

          <button
            onClick={submitAnswer}
            disabled={!canSubmit}
            className={[styles.btn, canSubmit ? styles.btnSecondary : styles.btnSecondaryDisabled].join(" ")}
          >
            {loadingAnswer ? "Проверяю…" : "Проверить ответ"}
          </button>

          {hint ? (
            <>
              <div className={styles.sp12} />
              <div className={styles.hint}>
                <b>Подсказка:</b> {hint}
              </div>
            </>
          ) : null}

          {status ? (
            <>
              <div className={styles.sp12} />
              <div className={[styles.status, status.kind === "ok" ? styles.statusOk : styles.statusBad].join(" ")}>
                {status.message}
              </div>
            </>
          ) : null}

          <div className={styles.sp12} />

          <details className={styles.details}>
            <summary className={styles.detailsSummary}>Технические детали (для отладки)</summary>
            <div style={{ marginTop: 8, lineHeight: 1.6 }}>
              <div>
                <b>questId:</b> {questId ?? "—"}
              </div>
              <div>
                <b>gameSessionId:</b> {gameSessionId ?? "—"}
              </div>
              <div>
                <b>stepOrder:</b> 1
              </div>
            </div>
          </details>
        </section>

        <footer className={styles.footer}>Под мобилку: кнопки на всю ширину, большие поля ввода, норм отступы.</footer>
      </div>
    </main>
  );
}
