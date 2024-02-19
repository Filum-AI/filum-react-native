"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var react_native_webview_1 = require("react-native-webview");
var SurveyWebview = function (_a) {
    var visible = _a.visible, campaignId = _a.campaignId, userEmail = _a.userEmail, userPhone = _a.userPhone, transactionId = _a.transactionId, onClose = _a.onClose;
    var uri = "https://survey.filum.asia/".concat(campaignId, "?User Phone=").concat(userPhone, "&User Email=").concat(userEmail, "&Transaction ID=").concat(transactionId, "&source=mobile");
    return (react_1.default.createElement(react_native_1.Modal, { presentationStyle: "pageSheet", animationType: "slide", visible: visible },
        react_1.default.createElement(react_native_webview_1.WebView, { source: {
                uri: uri,
            } }),
        react_1.default.createElement(react_native_1.TouchableOpacity, { style: styles.closeIconWrapper, onPress: onClose },
            react_1.default.createElement(react_native_1.Image, { style: styles.closeIcon, source: {
                    uri: "https://img.icons8.com/?size=256&id=8112&format=png",
                } }))));
};
var styles = react_native_1.StyleSheet.create({
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
exports.default = SurveyWebview;
