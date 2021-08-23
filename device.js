import AsyncStorage from '@react-native-async-storage/async-storage';
const DeviceInfo = require('react-native-device-info')
import uuid from 'react-native-uuid';

// Device keys
const DEVICE_ID = 'id'; // getUniqueId()
const DEVICE_MANUFACTURER = 'manufacturer'; // getManufacturer()
const DEVICE_MODEL = 'model'; // getDeviceId()
const DEVICE_NAME = 'name'; // getDeviceName()  
const DEVICE_TYPE = 'type'; // getDeviceType()
const DEVICE_VERSION = 'version'; // getSystemVersion()

const DEVICE_APP_NAME = 'name';
const DEVICE_APP_VERSION = 'version';
const DEVICE_APP_BUILD = 'build';

const DEVICE_OS = 'name'; // getSystemName()
const DEVICE_OS_VERSION = 'version'; // getSystemVersion()

const DEVICE_CARRIER = 'carrier'; // getCarrier()

class DeviceInfoManager {
    deviceProps = {}

    constructor() {
        this.deviceProps.device = {}
        this.deviceProps.app = {}
        this.deviceProps.os = {}
        this.deviceProps.network = {}
    }

    async getDeviceInfo() {
        this.deviceProps.device[DEVICE_ID] = await this.getDeviceID();
        this.deviceProps.device[DEVICE_MANUFACTURER] = await this.getDeviceManufacturer();
        this.deviceProps.device[DEVICE_MODEL] = this.getDeviceModel();
        this.deviceProps.device[DEVICE_NAME] = await this.getDeviceName();
        this.deviceProps.device[DEVICE_TYPE] = this.getDeviceType();
        this.deviceProps.device[DEVICE_VERSION] = this.getDeviceVersion();

        this.deviceProps.app[DEVICE_APP_NAME] = this.getApplicationName();
        this.deviceProps.app[DEVICE_APP_VERSION] = this.getApplicationVersion();
        this.deviceProps.app[DEVICE_APP_BUILD] = this.getApplicationBuild();

        this.deviceProps.os[DEVICE_OS] = this.getDeviceOS();
        this.deviceProps.os[DEVICE_OS_VERSION] = this.getDeviceOSVersion();

        this.deviceProps.network[DEVICE_CARRIER] = await this.getDeviceCarrier();
        
        return this.deviceProps;
    }

    async getDeviceID() {
        try{
            let uniqueId = DeviceInfo.getUniqueId();
            if(uniqueId){
                await AsyncStorage.setItem(DEVICE_ID, uniqueId.toString());
                return uniqueId
            } else {
                let uniqueId = await AsyncStorage.getItem(DEVICE_ID);
                if(uniqueId) {
                    return uniqueId;
                }else {
                    let uniqueId = uuid.v4();
                    await AsyncStorage.setItem(DEVICE_ID, uniqueId.toString());
                    return uniqueId;
                }
            }
        }
        catch(err){
            console.error(err);
            return '';
        }
    }

    async getDeviceManufacturer() {
        try {
            let manufacturer = await DeviceInfo.getManufacturer();
            if (manufacturer){
                return manufacturer;
            }
            else{
                console.warn("Cannot get device manufacturer");
                return '';
            }
        }
        catch(err){
            return '';
        }
    }

    getDeviceModel() {
        try {
            let deviceId = DeviceInfo.getDeviceId();
            if (deviceId) {
                return deviceId;
            }
            else{
                console.warn("Cannot get device model");
                return '';
            }
        } catch (error) {
            return '';
        }
    }

    async getDeviceName() {
        try {
            let deviceName = await DeviceInfo.getDeviceName();
            if (deviceName) {
                return deviceName;
            }
            else {
                console.warn("Cannot get device name");
                return '';
            }
        } catch (error) {
            return '';
        }
    }

    getDeviceType() {
        try {
            let deviceType = DeviceInfo.getDeviceType();
            if (deviceType) {
                return deviceType;
            }
            else {
                console.warn("Cannot get device type");
                return '';
            }
        } catch (error) {
            return '';
        }
    }

    getDeviceVersion() {
        try {
            let deviceVersion = DeviceInfo.getDeviceId();
            if (deviceVersion) {
                return deviceVersion;
            }
            else {
                console.warn("Cannot get device version");
                return '';
            }
        } catch (error) {
           return ''; 
        }
    }

    getApplicationName() {
        try {
            let appName = DeviceInfo.getApplicationName();
            if (appName) {
                return appName;
            }
            else {
                console.warn("Cannot get application name");
                return '';
            }
        } catch (error) {
            return '';
        }
    }

    getApplicationVersion() {
        try {
            let appVersion = DeviceInfo.getVersion();
        if (appVersion) {
            return appVersion;
        }
        else {
            console.warn("Cannot get application version");
            return '';
        }
        } catch (error) {
            return '';
        }
    }

    getApplicationBuild() {
        try {
            let appBuild = DeviceInfo.getBuildNumber();
            if (appBuild) {
                return appBuild;
            }
            else {
                console.warn("Cannot get application build");
                return '';
            }
        } catch (error) {
           return ''; 
        }
    }

    getDeviceOS() {
        try {
            let deviceOS = DeviceInfo.getSystemName();
        if (deviceOS) {
            return deviceOS;
        }
        else {
            console.warn("Cannot get device OS");
            return '';
        }
        } catch (error) {
            return '';
        }
    }

    getDeviceOSVersion() {
        try {
            let deviceOSVersion = DeviceInfo.getSystemVersion();
            if (deviceOSVersion) { 
                return deviceOSVersion;
            }
            else {
                console.warn("Cannot get device version");
                return '';
            }
        } catch (error) {
            return '';
        }
    }

    async getDeviceCarrier() {
        try {
            let deviceCarrier = await DeviceInfo.getCarrier();
            if (deviceCarrier) {
                return deviceCarrier;
            }
            else {
                console.warn("Cannot get carrier");
                return '';
            }
        } catch (error) {
            return '';
        }
    }
}

module.exports = DeviceInfoManager