import AsyncStorage from '@react-native-community/async-storage';

//Simple Key:Value store for React Native used to store
//and persist important cookies intercepted by the webview

class StorageService {
    constructor() {
        this.store = AsyncStorage
    }

    getValue = async (key) => {
        return new Promise((resolve, reject) => {
            this.store
                .getItem(key)
                .then(response => resolve(JSON.parse(response)))
                .catch(error => reject(error));
        });
    }

    setValue = async (key, value) => {
        return new Promise((resolve, reject) => {
            this.store
                .setItem(key, JSON.stringify(value))
                .then(() => resolve())
                .catch(error => reject(error));
        });
    }

    getMultipleValues = async (keys) => {
        return new Promise((resolve, reject) => {
            this.store
                .multiGet([...keys])
                .then(values => resolve(values))
                .catch(error => reject(error))
        })
    }

    removeValue = async (key) => {
        return new Promise((resolve, reject) => {
            this.store.removeItem(key)
                .then(() => resolve())
                .catch(error => reject(error))
        });
    }
}

const storageService = new StorageService();
export default storageService;