// const AsyncStorage = require('@react-native-async-storage/async-storage')
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function asyncStoragePut(_key, _value) {
  try {
    await AsyncStorage.setItem(_key, _value.toString());
  } catch (e) {
    console.error(error)
  }
};

export async function asyncStorageGet(_key) {
  let _value;
  try {
    _value = await AsyncStorage.getItem(_key);
  } catch (error) {
    console.log(error);
  }
  return _value;
}
