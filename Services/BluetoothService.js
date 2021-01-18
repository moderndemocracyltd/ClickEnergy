import { Platform, PermissionsAndroid, NativeEventEmitter, NativeModules } from "react-native";
import BleManager from "react-native-ble-manager";
import Buffer from "buffer";

import { bytesToHex } from "../Helpers/Utils";
import Constants from "../Helpers/Contants";
import Meter from "../Helpers/Meter";

class BluetoothService {
    constructor() {
        this.btModule = NativeModules.BleManager;
        this.emitter = new NativeEventEmitter(this.btModule);

        this.peripherals = new Map();
        this.scanning = false;

        this.setTopUpSuccessUI = null;
        this.setTopUpFailureUI = null;
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

    addCallbacks = (setUIScanning, setTopUpSuccessUI, setTopUpFailureUI) => {
        this.setUIScanning = setUIScanning;
        this.setTopUpSuccessUI = setTopUpSuccessUI;
        this.setTopUpFailureUI = setTopUpFailureUI;
    }

    getPeripherals = () => {
        return this.peripherals;
    }

    startScanning = async () => {
        try {
            if (!this.scanning) {
                this.scanning = true;
                this.setUIScanning(true);
                await BleManager.scan([], 15, false);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    handleStopScan = async () => {
        try {
            await BleManager.stopScan();
            this.scanning = false;
            this.setUIScanning(false);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    handleDiscoverPeripheral = peripheral => {
        if (peripheral.name) {
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
                await BleManager.connect(peripheral.id);
                this.peripherals.set(peripheral.id, device);
                Meter.setMeterId(peripheral.id);
                Meter.setMeterName(peripheral.name);
            }
        } catch (error) {
            console.error("Error while connecting device:", error);
            throw error;
        }
    }

    disconnectFromMeter = async () => {
        try {
            const meterId = Meter.getMeterId();
            if (meterId) {
                return await BleManager.disconnect(meterId);
            }
        } catch (error) {
            console.error("Error disconnecting device:", error);
            throw error;
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
            throw error;
        }
    }

    handleUpdateValueForCharacteristic = async data => {
        const { TRANSPARENT_COMMAND_RESPONSE } = Constants;
        if (bytesToHex(data.value) === bytesToHex(TRANSPARENT_COMMAND_RESPONSE)) {
            Meter.setMeterIsTransparent();
        } else {
            this.parseMeterResponse(data);
        }
    }

    parseMeterResponse = async (meterRes) => {
        Meter.addMeterResponse(`${bytesToHex(meterRes.value)}`);
        
        const converted = Buffer.Buffer.from(Meter.getMeterResponse(), 'hex').toString();
        const response = converted.split("").reverse().join("");

        if (response.includes("DAYS LEFT") || response.includes("NO DATA")) {
            Meter.setMeterResponse("");
        }

        if (response.includes("ACCOUNT") && response.includes("#")) {
            const balance = response.split("#")[1];
            Meter.setMeterBalance(balance);
            this.setTopUpSuccessUI(true);
            await this.stopNotifying(meterRes.peripheral);
        }
    }

    sendDataToDevice = async (peripheral, data) => {
        try {
            const { id } = peripheral;

            await this.sendTransparentMessageToMeter(id);
            //await this.sendVendCode(data);
            await this.sendGetAccountMessageToMeter(id);
        } catch (error) {
            console.error("Error sending data:", error);
            throw error;
        }
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
        try {
            const { SERVICE_UUID, RX, TX, TRANSPARENT_COMMAND } = Constants;
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            await BleManager.write(meterId, SERVICE_UUID, TX, TRANSPARENT_COMMAND);
            await BleManager.stopNotification(meterId, SERVICE_UUID, RX);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    sendGetAccountMessageToMeter = async meterId => {
        try {
            const { SERVICE_UUID, RX, TX, GET_ACCOUNT_BALANCE } = Constants;
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            await BleManager.write(meterId, SERVICE_UUID, TX, GET_ACCOUNT_BALANCE);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    stopNotifying = async meterId => {
        try {
            const { SERVICE_UUID, RX } = Constants;
            await BleManager.stopNotification(meterId, SERVICE_UUID, RX);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    sendVendCode = async (meterId, code) => {
        try {
            const { SERVICE_UUID, RX, TX, START_TOP_UP } = Constants;
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            await BleManager.write(meterId, SERVICE_UUID, TX, START_TOP_UP);

            //PARSE EACH DIGIT OF CODE AND PROCESS INTO PACKETS TO SEND TO METER
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    killTransparentMode = async meterId => {
        try {
            const { SERVICE_UUID, RX, TX, BRING_FREEDOM_OUT_OF_TRANS_MODE } = Constants;
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            await BleManager.write(meterId, SERVICE_UUID, TX, BRING_FREEDOM_OUT_OF_TRANS_MODE);
            await BleManager.stopNotification(meterId, SERVICE_UUID, RX);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const bluetoothService = new BluetoothService()
export default bluetoothService;