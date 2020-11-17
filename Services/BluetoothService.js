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

            const pairCommand = ["55", "BB", "01", "44"]; //this.convertCodeToByteArray("55 BB 01 44");
            const getAccountCommand = ["C2", "31"]; //this.convertCodeToByteArray("C2 31");
            const keepAliveCommand = ["55", "BB", "03", "42"]; //this.convertCodeToByteArray("55 BB 03 42");

            const { id } = peripheral;
            const peripheralInfo = await BleManager.retrieveServices(id);
            const [readService, readWriteService] = peripheralInfo.services;


            setInterval(async () => {
                await BleManager.write(peripheral.id, readWriteService, "49535343-6DAA-4D02-ABF6-19569ACA69FE", keepAliveCommand);
                console.log("Keep Alive response");
            }, 20000);

            console.log("Info", peripheralInfo);

            let characteristic = null;
            for (const item of peripheralInfo.characteristics) {
                if (item.service === readWriteService) {
                    characteristic = item.characteristic;
                }
            }

            await BleManager.write(id, readWriteService, characteristic, pairCommand);
            console.log("Pair response");

            await timeout(1000);
            await BleManager.startNotification(id, readWriteService, characteristic);
            await BleManager.retrieveServices(id);
            await BleManager.write(id, readWriteService, characteristic, getAccountCommand);

            await timeout(3000);
            await BleManager.retrieveServices(id);
            const readData = await BleManager.read(id, readWriteService, characteristic);
            
            console.log("Read Data", readData);
            console.log("Wrote Data", pairCommand.join(', '));

            // await timeout(4000);
            // const balance = await BleManager.write(peripheral.id, serviceValue, characteristic, getDays);
            // console.log("response days", balance);

            // setInterval(
            // async () => {
            //     const keepAlive = this.convertCodeToByteArray("55 BB 03 42");
            //     const res = await BleManager.write(peripheral.id, readWriteService, "49535343-6DAA-4D02-ABF6-19569ACA69FE", keepAlive);
            //     console.log("Pair response", res);
            // }, 
            // 1000)
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