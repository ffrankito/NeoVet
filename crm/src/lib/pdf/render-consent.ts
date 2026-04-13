import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { createElement } from "react";
import {
  SurgeryConsentDocument,
  type SurgeryConsentProps,
} from "./templates/surgery-consent";
import {
  EuthanasiaConsentDocument,
  type EuthanasiaConsentProps,
} from "./templates/euthanasia-consent";
import {
  ReproductiveAgreementDocument,
  type ReproductiveAgreementProps,
} from "./templates/reproductive-agreement";
import {
  SedationConsentDocument,
  type SedationConsentProps,
} from "./templates/sedation-consent";

export type ConsentTemplateType =
  | "surgery_consent"
  | "euthanasia_consent"
  | "reproductive_agreement"
  | "sedation_consent";

type TemplatePropsMap = {
  surgery_consent: SurgeryConsentProps;
  euthanasia_consent: EuthanasiaConsentProps;
  reproductive_agreement: ReproductiveAgreementProps;
  sedation_consent: SedationConsentProps;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = (props: any) => ReactElement;

const templateComponents: Record<ConsentTemplateType, AnyComponent> = {
  surgery_consent: SurgeryConsentDocument,
  euthanasia_consent: EuthanasiaConsentDocument,
  reproductive_agreement: ReproductiveAgreementDocument,
  sedation_consent: SedationConsentDocument,
};

/**
 * Renders a consent PDF document to a Buffer.
 *
 * @param templateType - Which consent template to use
 * @param data - Props for the chosen template (type-checked per template)
 * @returns PDF as a Node.js Buffer
 *
 * @example
 * ```ts
 * const buffer = await renderConsentPdf("surgery_consent", {
 *   clientName: "Juan P\u00e9rez",
 *   clientDni: "30.123.456",
 *   clientAddress: "Av. Pellegrini 1234",
 *   patientName: "Rocky",
 *   patientSpecies: "Canino Macho",
 *   patientBreed: "Bulldog Franc\u00e9s",
 *   patientCoatColor: "Atigrado",
 *   patientWeight: "12",
 *   patientDob: "15/03/2020",
 *   date: "08/04/2026",
 * });
 * ```
 */
export async function renderConsentPdf<T extends ConsentTemplateType>(
  templateType: T,
  data: TemplatePropsMap[T] | Record<string, string>
): Promise<Buffer> {
  const Component = templateComponents[templateType];

  if (!Component) {
    throw new Error(
      `Unknown consent template type: "${templateType}". Valid types: ${Object.keys(templateComponents).join(", ")}`
    );
  }

  // createElement is needed because renderToBuffer expects a ReactElement,
  // not a JSX expression (this file is .ts, not .tsx)
  const element = createElement(Component, data);
  const buffer = await renderToBuffer(
    element as unknown as ReactElement<DocumentProps>
  );

  return Buffer.from(buffer);
}
