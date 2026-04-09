import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  // Page
  page: {
    size: "A4",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },

  // Header layout
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  clinicInfoBlock: {
    flex: 1,
  },
  clinicName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginBottom: 2,
  },
  clinicInfo: {
    fontSize: 9,
    color: "#555555",
    lineHeight: 1.5,
  },

  // History box (top-right)
  historyBox: {
    border: "1pt solid #333333",
    padding: 8,
    minWidth: 180,
    alignItems: "flex-end",
  },
  historyBoxText: {
    fontSize: 9,
    lineHeight: 1.6,
    textAlign: "right",
  },
  historyBoxBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.6,
    textAlign: "right",
  },

  // Separator
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    borderBottomStyle: "solid",
    marginTop: 10,
    marginBottom: 10,
  },

  // Date right-aligned
  dateRight: {
    fontSize: 10,
    textAlign: "right",
    marginBottom: 16,
  },

  // Title
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 20,
  },

  // Body text
  body: {
    fontSize: 11,
    lineHeight: 1.6,
    textAlign: "justify",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  bodyBold: {
    fontSize: 11,
    lineHeight: 1.6,
    textAlign: "justify",
    fontFamily: "Helvetica-Bold",
  },
  bodySpacing: {
    marginTop: 12,
  },

  // Patient info block
  patientInfo: {
    fontSize: 11,
    lineHeight: 1.8,
    marginTop: 12,
    marginBottom: 12,
  },
  patientInfoLine: {
    fontSize: 11,
    lineHeight: 1.8,
  },
  patientInfoLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.8,
  },

  // Signature line
  signatureBlock: {
    position: "absolute",
    bottom: 80,
    right: 40,
    alignItems: "center",
    width: 200,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    borderBottomStyle: "solid",
    width: 200,
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 10,
    textAlign: "center",
  },

  // Footer (page numbers)
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#777777",
  },
});
