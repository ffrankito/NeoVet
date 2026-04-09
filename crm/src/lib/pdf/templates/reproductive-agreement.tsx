import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { ClinicHeader } from "../clinic-header";

export interface ReproductiveAgreementProps {
  clientName: string;
  clientDni: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  patientName: string;
  patientAge: string;
  patientBreedAndCoat: string;
  patientPedigree?: string;
  historyNumber?: string;
  date: string;
}

export function ReproductiveAgreementDocument(
  props: ReproductiveAgreementProps
) {
  const {
    clientName,
    clientDni,
    clientAddress,
    clientPhone,
    clientEmail,
    patientName,
    patientAge,
    patientBreedAndCoat,
    patientPedigree,
    historyNumber,
    date,
  } = props;

  return (
    <Document>
      {/* Page 1 */}
      <Page size="A4" style={styles.page}>
        <ClinicHeader
          patientName={patientName}
          historyNumber={historyNumber}
          date={date}
        />

        <Text style={styles.dateRight}>{date}</Text>

        <Text style={[styles.title, { fontSize: 16, marginBottom: 14 }]}>
          {`Acuerdo de asistencia profesional veterinaria`}
        </Text>
        <Text
          style={[
            styles.title,
            { fontSize: 13, marginBottom: 20, fontFamily: "Helvetica" },
          ]}
        >
          {`Servicio de asesor\u00eda reproductiva (primera etapa)`}
        </Text>

        {/* Parties */}
        <View style={styles.body}>
          <Text>
            {`Entre las partes:`}
          </Text>
        </View>

        <View style={[styles.body, styles.bodySpacing]}>
          <Text>
            <Text style={styles.bold}>PROFESIONAL: </Text>
            {`Neovet \u2014 Veterinaria especializada en razas braquic\u00e9falas, con domicilio en Morrow 4064, Rosario, Santa Fe.`}
          </Text>
        </View>

        <View style={[styles.body, styles.bodySpacing]}>
          <Text>
            <Text style={styles.bold}>CLIENTE: </Text>
            {`${clientName}, DNI ${clientDni}, con domicilio en ${clientAddress}, tel\u00e9fono ${clientPhone}, email ${clientEmail}.`}
          </Text>
        </View>

        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bold}>
            {`DATOS DEL ANIMAL:`}
          </Text>
        </View>

        <View style={styles.patientInfo}>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Nombre: </Text>
            {patientName}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Edad: </Text>
            {patientAge}
          </Text>
          <Text style={styles.patientInfoLine}>
            <Text style={styles.patientInfoLabel}>Raza y pelaje: </Text>
            {patientBreedAndCoat}
          </Text>
          {patientPedigree && (
            <Text style={styles.patientInfoLine}>
              <Text style={styles.patientInfoLabel}>Pedigree: </Text>
              {patientPedigree}
            </Text>
          )}
        </View>

        {/* GenetiCan1 section */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`PRIMERA CL\u00c1USULA \u2014 Objeto del acuerdo`}
          </Text>
        </View>
        <View style={[styles.body, { marginTop: 6 }]}>
          <Text>
            {`El presente acuerdo tiene por objeto la prestaci\u00f3n del servicio de asesor\u00eda reproductiva integral denominado `}
            <Text style={styles.bold}>GenetiCan1 (primera etapa)</Text>
            {`, que incluye:`}
          </Text>
        </View>

        <View style={[styles.body, { marginTop: 8, paddingLeft: 16 }]}>
          <Text>{`\u2022 Evaluaci\u00f3n cl\u00ednica general del animal reproductor.`}</Text>
          <Text>{`\u2022 Estudios complementarios b\u00e1sicos: an\u00e1lisis de sangre, ecograf\u00eda reproductiva.`}</Text>
          <Text>{`\u2022 Determinaci\u00f3n de aptitud reproductiva inicial.`}</Text>
          <Text>{`\u2022 Asesoramiento sobre el momento \u00f3ptimo de servicio.`}</Text>
          <Text>{`\u2022 Seguimiento del ciclo estral mediante citolog\u00eda vaginal y/o dosaje hormonal (progesterona).`}</Text>
          <Text>{`\u2022 Informe escrito con los resultados y recomendaciones.`}</Text>
        </View>

        {/* Not included */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`SEGUNDA CL\u00c1USULA \u2014 Prestaciones NO incluidas`}
          </Text>
        </View>
        <View style={[styles.body, { marginTop: 6 }]}>
          <Text>
            {`No se encuentran incluidos en el presente acuerdo los siguientes servicios, que podr\u00e1n ser contratados por separado:`}
          </Text>
        </View>
        <View style={[styles.body, { marginTop: 8, paddingLeft: 16 }]}>
          <Text>{`\u2022 Inseminaci\u00f3n artificial (natural o quir\u00fargica).`}</Text>
          <Text>{`\u2022 Seguimiento de gestaci\u00f3n y atenci\u00f3n del parto.`}</Text>
          <Text>{`\u2022 Ces\u00e1rea u otras intervenciones quir\u00fargicas.`}</Text>
          <Text>{`\u2022 Estudios gen\u00e9ticos (ADN, panel de enfermedades hereditarias).`}</Text>
          <Text>{`\u2022 Tratamientos derivados de hallazgos patol\u00f3gicos.`}</Text>
          <Text>{`\u2022 Medicaci\u00f3n adicional no contemplada en la evaluaci\u00f3n inicial.`}</Text>
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

      {/* Page 2 */}
      <Page size="A4" style={styles.page}>
        <ClinicHeader
          patientName={patientName}
          historyNumber={historyNumber}
          date={date}
        />

        <View style={[styles.separator, { marginTop: 0 }]} />

        {/* Confidentiality */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`TERCERA CL\u00c1USULA \u2014 Confidencialidad`}
          </Text>
        </View>
        <View style={[styles.body, { marginTop: 6 }]}>
          <Text>
            {`Ambas partes se comprometen a mantener la confidencialidad de la informaci\u00f3n intercambiada en el marco de este acuerdo, incluyendo datos cl\u00ednicos del animal, resultados de estudios y recomendaciones profesionales. Dicha informaci\u00f3n no podr\u00e1 ser compartida con terceros sin consentimiento previo por escrito de la otra parte.`}
          </Text>
        </View>

        {/* Payment */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`CUARTA CL\u00c1USULA \u2014 Condiciones de pago`}
          </Text>
        </View>
        <View style={[styles.body, { marginTop: 6 }]}>
          <Text>
            {`El valor total del servicio GenetiCan1 (primera etapa) ser\u00e1 abonado de la siguiente manera:`}
          </Text>
        </View>
        <View style={[styles.body, { marginTop: 8, paddingLeft: 16 }]}>
          <Text>{`\u2022 50% al momento de la firma del presente acuerdo, en concepto de se\u00f1a.`}</Text>
          <Text>{`\u2022 50% restante al finalizar la primera etapa y entregar el informe de resultados.`}</Text>
        </View>
        <View style={[styles.body, { marginTop: 8 }]}>
          <Text>
            {`Los medios de pago aceptados son: efectivo, transferencia bancaria o Mercado Pago. En caso de cancelaci\u00f3n por parte del cliente una vez iniciado el servicio, la se\u00f1a no ser\u00e1 reembolsable.`}
          </Text>
        </View>

        {/* No guarantee */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`QUINTA CL\u00c1USULA \u2014 Limitaci\u00f3n de garant\u00edas`}
          </Text>
        </View>
        <View style={[styles.body, { marginTop: 6 }]}>
          <Text>
            {`El servicio de asesor\u00eda reproductiva no garantiza la preñez del animal ni el \u00e9xito reproductivo. La asesor\u00eda profesional se limita a la evaluaci\u00f3n cl\u00ednica, el seguimiento del ciclo y las recomendaciones t\u00e9cnicas basadas en la evidencia disponible. Los resultados reproductivos dependen de m\u00faltiples factores biol\u00f3gicos que escapan al control profesional.`}
          </Text>
        </View>

        {/* Acceptance */}
        <View style={[styles.body, styles.bodySpacing]}>
          <Text style={styles.bodyBold}>
            {`SEXTA CL\u00c1USULA \u2014 Aceptaci\u00f3n`}
          </Text>
        </View>
        <View style={[styles.body, { marginTop: 6 }]}>
          <Text>
            {`Ambas partes declaran haber le\u00eddo y comprendido la totalidad del presente acuerdo, acept\u00e1ndolo en todos sus t\u00e9rminos. Se firman dos ejemplares de un mismo tenor y a un solo efecto, en la ciudad de Rosario, a los ${date}.`}
          </Text>
        </View>

        {/* Dual signature block */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 60,
            paddingHorizontal: 20,
          }}
        >
          {/* Client signature */}
          <View style={{ alignItems: "center", width: 200 }}>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "#333333",
                borderBottomStyle: "solid",
                width: 200,
                marginBottom: 6,
              }}
            />
            <Text style={{ fontSize: 10, textAlign: "center" }}>
              Firma del cliente
            </Text>
            <Text
              style={{
                fontSize: 9,
                textAlign: "center",
                color: "#555555",
                marginTop: 2,
              }}
            >
              {clientName}
            </Text>
            <Text
              style={{
                fontSize: 9,
                textAlign: "center",
                color: "#555555",
              }}
            >
              DNI {clientDni}
            </Text>
          </View>

          {/* Professional signature */}
          <View style={{ alignItems: "center", width: 200 }}>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "#333333",
                borderBottomStyle: "solid",
                width: 200,
                marginBottom: 6,
              }}
            />
            <Text style={{ fontSize: 10, textAlign: "center" }}>
              Firma del profesional
            </Text>
            <Text
              style={{
                fontSize: 9,
                textAlign: "center",
                color: "#555555",
                marginTop: 2,
              }}
            >
              Neovet
            </Text>
          </View>
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
