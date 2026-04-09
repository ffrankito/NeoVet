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
export const vaccinationId = () => createId("vac");
export const dewormingId = () => createId("dew");
export const documentId = () => createId("doc");
export const groomingProfileId = () => createId("gpr");
export const groomingSessionId = () => createId("gss");
export const complementaryMethodId = () => createId("cmp");
export const serviceId = () => createId("svc");
export const scheduleBlockId = () => createId("blk");
export const followUpId = () => createId("fu");
export const productId  = () => createId("prd");
export const providerId = () => createId("prv");
export const stockEntryId = () => createId("ste");
export const saleId     = () => createId("sal");
export const saleItemId = () => createId("sli");
export const cashSessionId  = () => createId("csh");
export const cashMovementId = () => createId("cmv");
export const emailLogId = () => createId("log");
export const hospitalizationId = () => createId("hos");
export const hospitalizationObservationId = () => createId("hob");
export const procedureId = () => createId("prc");
export const procedureStaffId = () => createId("pst");
export const procedureSupplyId = () => createId("psu");
export const consentTemplateId = () => createId("ctm");
export const consentDocumentId = () => createId("cdc");
export const chargeId = () => createId("chg");