import { NativeEventEmitter, NativeModules } from "react-native";
import BleManager from "react-native-ble-manager";
import Buffer from "buffer";

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
                console.log("Scanning...");
                this.scanning = true;
                await BleManager.scan([], 30, false);
            }
        } catch (error) {
            console.error(error);
        }
    }

    handleStopScan = () => {
        this.scanning = false;
        console.log("Stopped scanning.");
    }

    handleDiscoverPeripheral = peripheral => {
        let local = this.peripherals;

        if (peripheral.name) {
            local.set(peripheral.id, peripheral);
            this.peripherals = local;
        }
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

    sendDataToDevice = async (peripheral, data) => {
        try {
            const Rx = "49535343-1E4D-4BD9-BA61-23C647249616";
            const Tx = "49535343-8841-43F4-A8D4-ECBE34729BB3";

            const enableTransparent = this.convertCodeToByteArray("55 BB 01 44");
            const getAccountCommand = this.convertCodeToByteArray("C2 31");
            const keepAliveCommand = this.convertCodeToByteArray("55 BB 03 42");

            const { id } = peripheral;
            let peripheralInfo = await BleManager.retrieveServices(id);
            const primaryService = peripheralInfo.services[1];

            setInterval(async () => {
                await BleManager.write(id, primaryService, Rx, keepAliveCommand);
                console.log("Keep Alive response");
            }, 60000);
            
            //Enable Transparent
            peripheralInfo = await BleManager.retrieveServices(id);
            await BleManager.startNotification(id, primaryService, Rx);
            await BleManager.write(id, primaryService, Rx, enableTransparent);
            await timeout(2000);
            
            //Try to Read from Rx
            await BleManager.startNotification(id, primaryService, Rx);
            const readData = await BleManager.read(id, primaryService, Rx);

            console.log(readData);
            console.log("Pair response");

            //Notify to read account
            await BleManager.startNotification(id, primaryService, Rx);
            peripheralInfo = await BleManager.retrieveServices(id);
            
            //Read Account
            await BleManager.write(id, primaryService, Rx, getAccountCommand);

            //Notify to read data
            await BleManager.startNotification(id, primaryService, Rx);
            peripheralInfo = await BleManager.retrieveServices(id);

            // const readData = await BleManager.read(id, primaryService, Rx);
            // console.log(readData);
        } catch (error) {
            console.error("Error sending data:", error);
        }
    }

    connectToDevice = async peripheral => {
        return new Promise(async (resolve, reject) => {
            try {
                let local = this.peripherals;
                let device = local.get(peripheral.id);

                if (device) {
                    const response = await BleManager.connect(peripheral.id);
                    if (response) {
                        console.log("Connected", peripheral.id);
                        device.connected = true;
                        local.set(peripheral.id, device);
                        this.peripherals = local;
                        resolve();
                    }
                }
            } catch (error) {
                console.error("Error while connecting device:", error);
                reject(error);
            }
        })
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

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const bluetoothService = new BluetoothService()
export default bluetoothService;