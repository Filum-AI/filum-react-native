# react-native-filum-survey

A React Native library for Filum survey

## Installation

```
npm i react-native-filum-survey
```

## Usage

```
import SurveyWebView from "react-native-filum-survey";

// ...
const [webviewVisible, setWebviewVisible] = useState(false);

  return (
    <SafeAreaView>
      <TouchableOpacity onPress={() => setWebviewVisible(true)}>
        <Text>Open survey</Text>
      </TouchableOpacity>
      <SurveyWebView
        visible={webviewVisible}
        onClose={() => setWebviewVisible(false)}
        campaignId="your_campaign_id"
        userEmail="user@email.com"
        userPhone="111222333"
      />
    </SafeAreaView>
  )
```

### Props

| Property      | Description                                                            |              Type |
| ------------- | ---------------------------------------------------------------------- | ----------------: |
| visible       | Whether the webview is visible or not                                  |           boolean |
| onClose       | The function that will be called when user clicks the close (x) button |          function |
| campaignId    | ID of the campaign                                                     |            string |
| userPhone     | User phone                                                             | string (optional) |
| userEmail     | User email                                                             | string (optional) |
| transactionId | ID of the transaction                                                  | string (optional) |
