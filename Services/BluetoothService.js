import { Platform, PermissionsAndroid, NativeEventEmitter, NativeModules } from "react-native";
import BleManager from "react-native-ble-manager";

import { bytesToHex } from "../Helpers/Utils";
import Constants from "../Helpers/Contants";
import Meter from "../Helpers/Meter";

class BluetoothService {
    constructor() {
        this.btModule = NativeModules.BleManager;
        this.emitter = new NativeEventEmitter(this.btModule);

        this.peripherals = new Map();
        this.scanning = false;
        this.keepAliveInterval = null;
        this.meterPackets = [];

        this.setIsTransparentUI = () => { };
        this.startTopUpUI = () => { };
        this.setTopUpSuccessUI = () => { };
        this.setTopUpFailureUI = () => { };
        this.setUIScanning = () => { };
    }

    getPeripherals = () => this.peripherals;

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

    addCallbacks = callbacks => {
        this.setUIScanning = callbacks.setScanning;
        this.setIsTransparentUI = callbacks.setIsTransparent;
        this.startTopUpUI = callbacks.setStartTopUp;
        this.setTopUpSuccessUI = callbacks.setTopUpSuccess;
        this.setTopUpFailureUI = callbacks.setTopUpFailure;
    }

    startScanning = async () => {
        try {
            if (!this.scanning) {
                this.scanning = true;
                this.setUIScanning(true);
                await BleManager.scan([], 20, false);
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
                Meter.setId(peripheral.id);
                Meter.setName(peripheral.name);
                Meter.setIsConnected(true);
            }
        } catch (error) {
            console.error("Error while connecting device:", error);
            throw error;
        }
    }

    disconnectFromMeter = async () => {
        try {
            const meterId = Meter.getId();
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

        console.log(bytesToHex(data.value));

        if (bytesToHex(data.value) === bytesToHex(TRANSPARENT_COMMAND_RESPONSE)) {
            Meter.setIsTransparent();
            this.setIsTransparentUI(true);
            this.keepAliveInterval = setInterval(() => this.sendKeepAliveMessage(Meter.getId()), 50000);
        }
        else {
            this.parseMeterResponse(data);
        }
    }

    parseMeterResponse = async meterRes => {
        Meter.addResponse(`${bytesToHex(meterRes.value)}`);
        const response = Meter.getParsedResponse();
        const raw = Meter.getRawResponse();

        if (response.includes("KEY CODE") && raw.includes("e5ff14aa0d")) {
            console.log("Contains KeyCode");
            Meter.setResponse("");
            this.startTopUpUI(true);
        }

        if (response.includes("ACCEPTED")) {
            console.log("Code Accepted!");
        }

        if (response.includes("REJECTED")) {
            console.log("Code Rejected!");
        }

        if (response.includes(Meter.setExpectedCRCresponse())) {
            console.log("Got expected Result");
            const nextPacket = Meter.getNextPacket();
            Meter.setExpectedCRCresponse(nextPacket, Meter.getExpectedCRCresponse());
            await this.sendPacket(nextPacket);
        }

        if (response.includes("ACCOUNT") && response.includes("#")) {
            const balance = response.split("#")[1];
            Meter.setBalance(balance);
            this.setTopUpSuccessUI(true);
            //await this.stopNotifying(meterRes.peripheral);
        }
        if (response.includes("DAYS LEFT") || response.includes("NO DATA")) {
            Meter.setResponse("");
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

    sendTransparentMessageToMeter = async () => {
        const meterId = Meter.getId();
        const { SERVICE_UUID, RX, TX, TRANSPARENT_COMMAND } = Constants;
        try {
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            await BleManager.write(meterId, SERVICE_UUID, TX, TRANSPARENT_COMMAND);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    sendKeepAliveMessage = async () => {
        const meterId = Meter.getId();
        const { SERVICE_UUID, RX, TX, KEEP_ALIVE } = Constants;
        try {
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            await BleManager.write(meterId, SERVICE_UUID, TX, KEEP_ALIVE);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    sendGetAccountMessageToMeter = async () => {
        const meterId = Meter.getId();
        const { SERVICE_UUID, RX, TX, GET_ACCOUNT_BALANCE } = Constants;
        try {
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            await BleManager.write(meterId, SERVICE_UUID, TX, GET_ACCOUNT_BALANCE);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    stopNotifying = async () => {
        const meterId = Meter.getId();
        const { SERVICE_UUID, RX } = Constants;
        try {
            await BleManager.stopNotification(meterId, SERVICE_UUID, RX);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    sendTopUpRequest = async () => {
        const meterId = Meter.getId();
        const { SERVICE_UUID, RX, TX, START_TOP_UP } = Constants;
        try {
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            await BleManager.write(meterId, SERVICE_UUID, TX, START_TOP_UP);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    startTopUp = async () => {
        try {
            const firstPacket = Meter.getNextPacket();
            // const res = getCRCResponse(firstPacket, Meter.getExpectedCRCresponse());
            // Meter.setExpectedCRCresponse(res);
            await this.sendPacket(firstPacket);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    sendPacket = async packet => {
        const meterId = Meter.getId();
        const { SERVICE_UUID, RX, TX } = Constants;
        try {
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            console.log("Sending Packet:", packet);
            await BleManager.write(meterId, SERVICE_UUID, TX, packet);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    killTransparentMode = async () => {
        const meterId = Meter.getId();
        const { SERVICE_UUID, RX, TX, BRING_FREEDOM_OUT_OF_TRANS_MODE } = Constants;
        try {
            await BleManager.retrieveServices(meterId);
            await BleManager.startNotification(meterId, SERVICE_UUID, RX);
            await BleManager.write(meterId, SERVICE_UUID, TX, BRING_FREEDOM_OUT_OF_TRANS_MODE);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const bluetoothService = new BluetoothService()
export default bluetoothService;