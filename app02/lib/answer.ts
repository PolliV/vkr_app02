import { createHash } from "crypto";

/**
 * Нормализация нужна, чтобы ответы сравнивались честно:
 * " Привет ", "привет", "ПРИВЕТ" -> одно и то же.
 */
export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Хэшируем нормализованный ответ. Так правильный ответ не хранится в открытую.
 */
export function hashAnswer(normalized: string): string {
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function checkAnswer(input: string, expectedHash: string): boolean {
  const normalized = normalizeAnswer(input);
  const hashed = hashAnswer(normalized);
  return hashed === expectedHash;
}
