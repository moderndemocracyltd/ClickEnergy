import { NativeEventEmitter, NativeModules } from "react-native";
import BleManager from "react-native-ble-manager";

class BluetoothService {
    constructor() {
        this.blutoothManager = NativeModules.BleManager;
        this.emitter = new NativeEventEmitter(this.blutoothManager);
        this.scanning = false;
        this.peripherals = new Map();
    }

    startListening = () => {
        this.emitter.addListener("BleManagerStopScan", this.handleStopScan);
        this.emitter.addListener("BleManagerDiscoverPeripheral", this.handleDiscoverPeripheral);
        this.emitter.addListener("BleManagerDisconnectPeripheral", this.handleDisconnectedPeripheral);
        this.emitter.addListener("BleManagerDidUpdateValueForCharacteristic", this.handleUpdateValueForCharacteristic);
        BleManager.start({ showAlert: false });
    }

    stopListening = () => {
        this.emitter.removeListener("BleManagerStopScan");
        this.emitter.removeListener("BleManagerDiscoverPeripheral");
        this.emitter.removeListener("BleManagerDisconnectPeripheral");
        this.emitter.removeListener("BleManagerDidUpdateValueForCharacteristic");
    }

    startScanning = async () => {
        try {
            if (!this.scanning) {
                const resultsPromise = await BleManager.scan([], 5, true)
                console.log("scanning...");
                this.scanning = true;
                return resultsPromise
            }
        } catch (error) {
            console.error(error);
        }
    }

    handleStopScan = () => {
        this.scanning = false;
    }

    handleDiscoverPeripheral = peripheral => {
        let local = this.peripherals;

        if (!peripheral.name) {
            peripheral.name = "NO NAME";
        }
        local.set(peripheral.id, peripheral);
        this.peripherals = local;
    }

    handleDisconnectedPeripheral = data => {
        let local = this.peripherals;
        let peripheral = local.get(data.peripheral);

        if (peripheral) {
            peripheral.connected = false;
            local.set(peripheral.id, peripheral);
            this.peripherals = local;
        }
    }

    handleUpdateValueForCharacteristic = data => {
        console.log(`Received data from '${data.peripheral}' characteristic '${data.characteristic}`, data.value);
    }

    retrieveConnected = async () => {
        try {
            const connectedResults = await BleManager.getConnectedPeripherals([]);

            if (connectedResults.length == 0) {
                console.log("No Devices Connected");
            }

            let local = this.peripherals;
            for (let result of connectedResults) {
                result.connected = true;
                local.set(result.id, result);
                this.peripherals = local;
            }
            return connectedResults
        } catch (error) {
            console.error(error);
        }
    }

    disconnectFromDevice = async peripheral => {
        try {
            let local = this.peripherals;
            let device = local.get(peripheral.id);

            if (device) {
                device.connected = false;
                local.set(peripheral.id, device);
                this.peripherals = local;
                return await BleManager.disconnect(peripheral.id);
            }
        } catch (error) {
            console.error("Error disconnecting device:", error);
        }
    }

    connectToDevice = async peripheral => {
        try {
            const response = await BleManager.connect(peripheral.id);
            if (response) {
                let local = this.peripherals;
                let device = local.get(peripheral.id);

                if (device) {
                    device.connected = true;
                    local.set(peripheral.id, device);
                    this.peripherals = local;
                }

                const peripheralInfo = await BleManager.retrieveServices(peripheral.id);
                const convertedCode = convertCodeToByteArray(KEY_CODE);
                const service = peripheralInfo.services[1]; //NEED TO READ MORE ABOUT SERVICES
                let characteristic = null; //NEED TO READ MORE ABOUT CHARACTERISTICS

                for (const item of peripheralInfo.characteristics) {
                    if (item.service === service) {
                        characteristic = item.characteristic;
                    }
                }

                const complete = await BleManager.writeWithoutResponse(peripheral.id, service, characteristic, convertedCode)
                if (complete) {
                    console.log("wrote data", convertedCode.join(', '))
                }
            }
        } catch (error) {
            console.error("Error while connecting device:", error);
        }
    }

    listConnectedDevices = () => {
        return Array.from(this.peripherals.values())
    }

    isScanning = () => {
        return this.scanning;
    }

    convertCodeToByteArray = code => {
        let bytes = [];
        for (const index in code) {
            const char = code.charCodeAt(index);
            bytes = bytes.concat([char & 0xff, char / 256 >>> 0]);
        }
        return bytes;
    }
}

const bluetoothService = new BluetoothService()
export default bluetoothService;