import { View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";

interface ClinicHeaderProps {
  patientName: string;
  historyNumber?: string;
  date: string;
}

export function ClinicHeader({
  patientName,
  historyNumber,
  date,
}: ClinicHeaderProps) {
  return (
    <>
      <View style={styles.header}>
        {/* Left: Clinic info */}
        <View style={styles.clinicInfoBlock}>
          <Text style={styles.clinicName}>NEOVET</Text>
          <Text style={styles.clinicInfo}>MORROW 4064</Text>
          <Text style={styles.clinicInfo}>
            +5493414424544 / +5493413101194
          </Text>
        </View>

        {/* Right: History box */}
        <View style={styles.historyBox}>
          {historyNumber && (
            <Text style={styles.historyBoxBold}>
              {`HISTORIAL CL\u00cdNICO N\u00b0: ${historyNumber}`}
            </Text>
          )}
          <Text style={styles.historyBoxText}>Nombre: {patientName}</Text>
          <Text style={styles.historyBoxText}>Fecha: {date}</Text>
        </View>
      </View>

      <View style={styles.separator} />
    </>
  );
}
