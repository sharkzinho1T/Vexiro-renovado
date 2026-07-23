// Rate limit simples em memória — funciona por instância. Em produção com
// tráfego real na Vercel (múltiplas instâncias serverless), troque por
// Upstash Redis (@upstash/ratelimit), que também tem plano gratuito.
const hits = new Map();

export function rateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const entry = hits.get(key) || { count: 0, reset: now + windowMs };

  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count += 1;
  hits.set(key, entry);

  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}
