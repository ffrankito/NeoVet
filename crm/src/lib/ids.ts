import { randomUUID } from "crypto";

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export const clientId = () => createId("cli");
export const patientId = () => createId("pat");
export const appointmentId = () => createId("apt");
export const staffId = () => createId("stf");
export const consultationId = () => createId("con");
export const treatmentItemId = () => createId("trt");
