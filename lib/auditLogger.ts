import AuditLog from '../models/AuditLog';

interface AuditLogPayload {
  action: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  targetType: 'order' | 'menuItem' | 'discount' | 'user';
  targetId: string;
  before?: any;
  after?: any;
  metadata?: any;
}

export async function logAudit(payload: AuditLogPayload) {
  try {
    await AuditLog.create(payload);
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Depending on strictness, we might throw or just log.
    // Architecture says "Wrap every audit log write in the same transaction as the mutation"
    // So this function is just a helper, caller handles transactions if needed.
  }
}
