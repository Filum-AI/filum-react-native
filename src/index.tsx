import React from "react";
import { Image, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
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
  const uri = `https://survey.filum.asia/${campaignId}?User Phone=${userPhone}&User Email=${userEmail}&Transaction ID=${transactionId}&source=mobile&popup=1`;

  return (
    <Modal transparent={true} animationType="slide" visible={visible}>
      <View style={styles.container}>
        <View style={styles.webviewContainer}>
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  webviewContainer: {
    width: "85%",
    marginBottom: 24,
    height: "70%",
    borderRadius: 16,
    overflow: "hidden",
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  closeIconWrapper: {
    position: "absolute",
    right: 0,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SurveyWebview;
