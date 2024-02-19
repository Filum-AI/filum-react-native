import React from "react";
import { Image, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";

interface Props {
  visible: boolean;
  campaignId: string;
  userPhone?: string;
  userEmail?: string;
  transactionId?: string;
  onClose?: () => void;
}

const SurveyWebview = ({
  visible,
  campaignId,
  userEmail,
  userPhone,
  transactionId,
  onClose,
}: Props) => {
  const uri = `https://survey.filum.asia/${campaignId}?User Phone=${userPhone}&User Email=${userEmail}&Transaction ID=${transactionId}&source=mobile`;

  return (
    <Modal
      presentationStyle="pageSheet"
      animationType="slide"
      visible={visible}
    >
      <WebView
        source={{
          uri,
        }}
      />
      <TouchableOpacity style={styles.closeIconWrapper} onPress={onClose}>
        <Image
          style={styles.closeIcon}
          source={{
            uri: "https://img.icons8.com/?size=256&id=8112&format=png",
          }}
        />
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeIcon: {
    width: 14,
    height: 14,
  },
  closeIconWrapper: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SurveyWebview;
