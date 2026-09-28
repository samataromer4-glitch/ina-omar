import type express from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message } = options;
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically clean up expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetAt) {
        hits.delete(key);
      }
    }
  }, windowMs);

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "global";
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    const record = hits.get(key);
    if (!record || now > record.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > max) {
      return res.status(429).json({
        error: message || "Codsiyo badan oo isdaba joog ah. Fadlan wax yar sug (Too many requests. Please try again shortly)."
      });
    }

    return next();
  };
}

export function validatePositiveAmount(amount: any): { valid: boolean; value: number; error?: string } {
  const val = Number(amount);
  if (isNaN(val) || !isFinite(val) || val <= 0) {
    return { valid: false, value: 0, error: "Cadadka lacagtu waa inuu ka weynaadaa 0 (Amount must be greater than 0)" };
  }
  if (val > 10_000_000) {
    return { valid: false, value: 0, error: "Cadadka lacagtu waa mid aad u weyn (Amount exceeds maximum limit)" };
  }
  return { valid: true, value: Math.round(val * 100) / 100 };
}
