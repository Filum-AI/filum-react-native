import React from "react";
interface Props {
    visible: boolean;
    campaignId: string;
    userPhone?: string;
    userEmail?: string;
    transactionId?: string;
    onClose?: () => void;
}
declare const SurveyWebview: ({ visible, campaignId, userEmail, userPhone, transactionId, onClose, }: Props) => React.JSX.Element;
export default SurveyWebview;
//# sourceMappingURL=index.d.ts.map