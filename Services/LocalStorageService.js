import AsyncStorage from '@react-native-community/async-storage';

//Simple Key:Value store for React Native used to store
//and persist important cookies intercepted by the webview

class StorageService {
    constructor() {
        this.store = AsyncStorage
    }

    getValue = async key => {
        try {
            const response = await this.store.getItem(key);
            const parsed = JSON.parse(response);
            return parsed
        } catch (error) {
            console.error("Error getting value:", error);
        }
    }

    setValue = async (key, value) => {
        try {
            const promise = await this.store.setItem(key, JSON.stringify(value));
            return promise;
        } catch (error) {
            console.error("Error setting value:", error);
        }
    }

    getMultipleValues = async keys => {
        try {
            const values = await this.store.multiGet(keys);
            const parsed = values.map(item => [item[0], JSON.parse(item[1])]);
            return parsed
        } catch (error) {
            console.error("Error getting multiple values:", error);
        }
    }

    removeValue = async key => {
        try {
            const promise = await this.store.removeItem(key);
            return promise
        } catch (error) {
            console.error("Error removing value:", error);
        }
    }
}

const storageService = new StorageService();
export default storageService;