# Filum React-Native

A React-Native client for [Filum](https://filum.ai)

## Installation
- Use `yarn`:
```bash
$ yarn add --save filum-react-native
```
```bash
$ npm install --save filum-react-native
```

## Usage
- Always call `filumAnalytics.identify(...)` whenever user sign in/up/sign-out
- identify() **should be called before track()** to incorporate your user_id in any track call.

```js
let Analytics = require('filum-react-native');

export const filumAnalytics = new Analytics(
  '<YOUR WRITEKEY HERE',
  {
    host: 'https://event.filum.ai',
  },
);

// In other files
import {filumAnalytics} from './analytics';
...
filumAnalytics.identify(user_id, {<user properties>});
filumAnalytics.track('Order Completed',
  {
      name: "Testing item",
      stock: 10,
      price: 11.5
  }
);
```

You can refer to the example repo [Filum React Native Sample App](https://github.com/Filum-AI/filum-react-native-sample)

## License

Released under the [MIT license](license.md).