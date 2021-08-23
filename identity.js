import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const ANONYMOUS_ID = 'anonymousID';
const USER_ID = 'userID';

class IdentityManager {
    static instance;
    anonymousID = '';
    userID = '';

    constructor() {
    }

    async loadAnonymousID(callback) {
        const _anonymousID = await AsyncStorage.getItem(ANONYMOUS_ID);
        if (_anonymousID === null) {
            this.resetIDs();
        } else {
            this.anonymousID = _anonymousID;
        };
        callback.bind(this)(this.anonymousID);
    }

    async loadUserID(callback) {
        var _userID = await AsyncStorage.getItem(USER_ID);
        if (_userID !== null) {
            this.userID = _userID;
        }
        else{
            this.userID = "";
        }
        callback.bind(this)( this.userID);
    }
    
    static getInstance() {
        if (!IdentityManager.instance) {
            IdentityManager.instance = new IdentityManager();
        }
        return IdentityManager.instance;
    }

    resetIDs() {
        var anonymousID = uuid.v4();
        this.updateAnonymousID(anonymousID);
        this.updateUserID("");
        return anonymousID;
    }

    async updateAnonymousID(anonymousID) {
        this.anonymousID = anonymousID;
        return await AsyncStorage.setItem(ANONYMOUS_ID, anonymousID.toString());
    }

    async updateUserID(userID) {
        this.userID = userID;
        return await AsyncStorage.setItem(USER_ID, userID.toString());
    }

    getAnonymousID() {
        return this.anonymousID;
    }

    getUserID() {
        return this.userID;
    }
}

module.exports = IdentityManager