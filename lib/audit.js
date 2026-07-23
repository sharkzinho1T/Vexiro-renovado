import { prisma } from "./prisma";

export async function logAudit(userId, action, metadata = {}) {
  try {
    await prisma.auditLog.create({ data: { userId: userId || null, action, metadata } });
  } catch (e) {
    console.error("Falha ao gravar log de auditoria:", e);
  }
}
