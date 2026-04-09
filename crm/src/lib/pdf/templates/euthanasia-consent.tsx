import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { ClinicHeader } from "../clinic-header";

export interface EuthanasiaConsentProps {
  clientName: string;
  clientDni: string;
  clientAddress: string;
  patientName: string;
  patientSpecies: string;
  patientBreed: string;
  patientCoatColor: string;
  patientWeight: string;
  patientDob: string;
  historyNumber?: string;
  date: string;
  vetName: string;
  vetLicenseNumber: string;
  diagnosis: string;
}

export function EuthanasiaConsentDocument(props: EuthanasiaConsentProps) {
  const {
    clientName,
    clientDni,
    clientAddress,
    patientName,
    patientSpecies,
    patientBreed,
    patientCoatColor,
    patientWeight,
    patientDob,
    historyNumber,
    date,
    vetName,
    vetLicenseNumber,
    diagnosis,
  } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ClinicHeader
          patientName={patientName}
          historyNumber={historyNumber}
          date={date}
        />

        <Text style={styles.dateRight}>{date}</Text>

        <Text style={styles.title}>Acta de eutanasia</Text>

        {/* Opening paragraph */}
        <View style={styles.body}>
          <Text>
            {`Por medio de este documento, yo `}
            <Text style={styles.bold}>{clientName}</Text>
            {` (${clientDni}) con direcci\u00f3n en ${clientAddress} en la ciudad de Rosario.`}
          </Text>
        </View>

        {/* Owner declaration */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            Siendo propietario del animal:
          </Text>
        </View>

        {/* Patient info */}
        <View style={styles.patientInfo}>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Nombre: </Text>
            {patientName}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Especie: </Text>
            {patientSpecies}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Raza: </Text>
            {patientBreed}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Pelaje: </Text>
            {patientCoatColor}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Peso: </Text>
            {patientWeight} Kg.
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Fecha de nacimiento: </Text>
            {patientDob}
          </Text>
        </View>

        {/* Vet authorization */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`Autoriza al suscripto Dr./Dra. `}
            <Text style={styles.bold}>{vetName}</Text>
            {` con MATR\u00cdCULA N\u00b0 `}
            <Text style={styles.bold}>{vetLicenseNumber}</Text>
            {` a practicar la EUTANASIA del animal mencionado, de conformidad con la t\u00e9cnica profesional habitual, inform\u00e1ndole, asimismo, en este acto, el diagnostico arribado consiste en:`}
          </Text>
        </View>

        {/* Diagnosis */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text>{diagnosis}</Text>
        </View>

        {/* Justification */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            lo cual justifica plenamente la medida a adoptarse.
          </Text>
        </View>

        {/* Legal declaration */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text>
            {`El due\u00f1o del animal declara bajo juramento que el animal a sacrificarse no mordido por un lapso no menor a los diez d\u00edas precedentes a la firma del presente, haci\u00e9ndole saber que en caso de falsedad u ocultaci\u00f3n de dichas circunstancias ser\u00e1 pasible de las sanciones que determine el art. 9\u00b0 de la Ley 8.056, sin perjuicios de la responsabilidad civil o penal que le pudiera corresponder (art. 19/23 del Dec. 4669/73).`}
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Firma del cliente</Text>
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `P\u00e1gina ${pageNumber} - ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
