import { Platform, PermissionsAndroid, NativeEventEmitter, NativeModules } from "react-native";
import BleManager from "react-native-ble-manager";
import Buffer from 'buffer';
import Constants from "../Utils/Contants";
import { bytesToHex } from "../Utils/Utils";

class BluetoothService {
    constructor() {
        this.btModule = NativeModules.BleManager;
        this.emitter = new NativeEventEmitter(this.btModule);

        this.peripherals = new Map();
        this.scanning = false;
        this.isTransparent = false;

        this.meterResponse = "";
        this.meterBalance = "";

        this.setUIList = null;
        this.setUIScanning = null;
    }

    setUpListeners = () => {
        this.emitter.addListener("BleManagerStopScan", this.handleStopScan);
        this.emitter.addListener("BleManagerDiscoverPeripheral", this.handleDiscoverPeripheral);
        this.emitter.addListener("BleManagerDisconnectPeripheral", this.handleDisconnectedPeripheral);
        this.emitter.addListener("BleManagerDidUpdateValueForCharacteristic", this.handleUpdateValueForCharacteristic);
        BleManager.start({ showAlert: false });
    }

    removeListeners = () => {
        this.emitter.removeListener("BleManagerStopScan");
        this.emitter.removeListener("BleManagerDiscoverPeripheral");
        this.emitter.removeListener("BleManagerDisconnectPeripheral");
        this.emitter.removeListener("BleManagerDidUpdateValueForCharacteristic");
    }

    startScanning = async () => {
        try {
            if (!this.scanning) {
                console.log("Scanning...");
                this.peripherals = new Map();
                this.scanning = true;
                this.setUIScanning(true);
                await BleManager.scan([], 15, false);
            }
        } catch (error) {
            console.error(error);
        }
    }

    handleStopScan = () => {
        this.scanning = false;
        this.setUIScanning(false);
        console.log("Stopped scanning.");
    }

    handleDiscoverPeripheral = peripheral => {
        if (peripheral.name) {
            console.log(peripheral.name);
            this.peripherals.set(peripheral.id, peripheral)
        }
    }

    handleDisconnectedPeripheral = data => {
        let peripheral = this.peripherals.get(data.peripheral);

        if (peripheral) {
            peripheral.connected = false;
            this.peripherals.set(peripheral.id, peripheral);
        }
    }

    connectToDevice = async peripheral => {
        try {
            let device = this.peripherals.get(peripheral.id);
            if (device) {
                const response = await BleManager.connect(peripheral.id);
                if (response) {
                    console.log("Connected", peripheral.id);
                    device.connected = true;
                    this.peripherals.set(peripheral.id, device);
                }
            }
        } catch (error) {
            console.error("Error while connecting device:", error);
        }
    }

    disconnectFromDevice = async peripheral => {
        try {
            let device = this.peripherals.get(peripheral.id);

            if (device) {
                device.connected = false;
                this.peripherals.set(peripheral.id, device);
                return await BleManager.disconnect(peripheral.id);
            }
        } catch (error) {
            console.error("Error disconnecting device:", error);
        }
    }

    retrieveConnected = async () => {
        try {
            const connectedResults = await BleManager.getConnectedPeripherals([]);
            for (let result of connectedResults) {
                result.connected = true;
                this.peripherals.set(result.id, result);
            }
            return connectedResults;
        } catch (error) {
            console.error(error);
        }
    }

    handleUpdateValueForCharacteristic = async data => {
        const { TRANSPARENT_COMMAND_RESPONSE } = Constants;

        if (bytesToHex(data.value) === bytesToHex(TRANSPARENT_COMMAND_RESPONSE)) {
            this.isTransparent = true;
        } else {
            this.meterResponse += `${bytesToHex(data.value)}`;
        }

        const converted = Buffer.Buffer.from(this.meterResponse, 'hex').toString();
        const response = converted.split("").reverse().join("");

        if (response.includes("DAYS LEFT") || response.includes("NO DATA")) {
            this.meterResponse = "";
        }

        if (response.includes("ACCOUNT") && response.includes("#")) {
            const balance = response.split("#")[1];
            this.meterBalance = balance;
            console.log("Meter balance: $",balance);
            await this.stopNotifying(data.peripheral);
        }
    }

    sendDataToDevice = async (peripheral, data) => {
        try {
            const { id } = peripheral;

            //Enable Transparent
            await this.sendTransparentMessageToMeter(id);

            //Send Vend Code
            //await this.sendVendCode(data);

            //Get Account Info
            await this.sendGetAccountMessageToMeter(id);
        } catch (error) {
            console.error("Error sending data:", error);
        }
    }

    getPeripherals = () => {
        return this.peripherals;
    }

    checkPermission = async () => {
        if (Platform.OS === 'android' && Platform.Version >= 23) {
            const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
            if (result) {
                return true;
            } else {
                const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                return result ? true : false;
            }
        }
        if (Platform.OS === 'ios') {
            return true;
        }
        return false;
    }

    sendTransparentMessageToMeter = async meterId => {
        const { SERVICE_UUID, RX, TX, TRANSPARENT_COMMAND } = Constants;
        await BleManager.retrieveServices(meterId);
        await BleManager.startNotification(meterId, SERVICE_UUID, RX);
        await BleManager.write(meterId, SERVICE_UUID, TX, TRANSPARENT_COMMAND);
        await BleManager.stopNotification(meterId, SERVICE_UUID, RX);
    }

    sendGetAccountMessageToMeter = async meterId => {
        const { SERVICE_UUID, RX, TX, GET_ACCOUNT_BALANCE } = Constants;
        await BleManager.retrieveServices(meterId);
        await BleManager.startNotification(meterId, SERVICE_UUID, RX);
        await BleManager.write(meterId, SERVICE_UUID, TX, GET_ACCOUNT_BALANCE);
    }

    stopNotifying = async meterId => {
        const { SERVICE_UUID, RX } = Constants;
        await BleManager.stopNotification(meterId, SERVICE_UUID, RX);
    }

    sendVendCode = async (meterId, code) => {
        const { SERVICE_UUID, RX, TX, START_TOP_UP } = Constants;
        await BleManager.retrieveServices(meterId);
        await BleManager.startNotification(meterId, SERVICE_UUID, RX);
        await BleManager.write(meterId, SERVICE_UUID, TX, START_TOP_UP);

        //PARSE EACH DIGIT OF CODE AND PROCESS INTO PACKETS TO SEND TO METER
    }

    killTransparentMode = async meterId => {
        const { SERVICE_UUID, RX, TX, BRING_FREEDOM_OUT_OF_TRANS_MODE } = Constants;
        await BleManager.retrieveServices(meterId);
        await BleManager.startNotification(meterId, SERVICE_UUID, RX);
        await BleManager.write(meterId, SERVICE_UUID, TX, BRING_FREEDOM_OUT_OF_TRANS_MODE);
        await BleManager.stopNotification(meterId, SERVICE_UUID, RX);
    }

    addCallbacks = (setUIScanning) => {
        this.setUIScanning = setUIScanning;
    }
}

const bluetoothService = new BluetoothService()
export default bluetoothService;