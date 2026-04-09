import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { ClinicHeader } from "../clinic-header";

export interface SurgeryConsentProps {
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
  procedureDescription?: string;
}

export function SurgeryConsentDocument(props: SurgeryConsentProps) {
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
    procedureDescription,
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

        <Text style={styles.title}>
          {`Autorizaci\u00f3n de cirug\u00eda y hospitalizaci\u00f3n`}
        </Text>

        {/* Opening paragraph */}
        <View style={styles.body}>
          <Text>
            {`Por medio de este documento, yo `}
            <Text style={styles.bold}>{clientName}</Text>
            {` (${clientDni}) con direcci\u00f3n en ${clientAddress} en la ciudad de Rosario.`}
          </Text>
        </View>

        {/* Authorization paragraph */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`Extiendo mi completa y total autorizaci\u00f3n en favor de Neovet, para que lleve a cabo los procedimientos m\u00e9dicos y/o quir\u00fargicos necesarios para el diagn\u00f3stico y tratamiento de:`}
            {procedureDescription ? (
              <Text style={styles.body}>{` ${procedureDescription}`}</Text>
            ) : null}
          </Text>
        </View>

        {/* Patient info */}
        <View style={[styles.patientInfo, styles.bodySpacing]}>
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

        {/* Responsibility clause */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`Acepto que dicha mascota es de mi propiedad por lo que me responsabilizo de los gastos que generen dichos procedimientos.`}
          </Text>
        </View>

        {/* Risk acknowledgement */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`As\u00ed mismo doy fe de que me han explicado claramente los posibles riesgos m\u00e9dicos, anest\u00e9sicos y quir\u00fargicos que estos implican.`}
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
