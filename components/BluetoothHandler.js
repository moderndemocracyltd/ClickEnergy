import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableHighlight,
    NativeEventEmitter,
    NativeModules,
    AppState,
    FlatList,
    Button,
    SafeAreaView
} from "react-native";
import BleManager from "react-native-ble-manager";

export default BluetoothHandler = (props) => {

    const KEY_CODE = props?.route?.params?.keyCode || null;

    const BleManagerModule = NativeModules.BleManager;
    const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

    const [appState, setAppState] = useState('');
    const [peripherals, setPeripherals] = useState(new Map());
    const [scanning, setScanning] = useState(false);

    const handleAppStateChange = (nextAppState) => {
        if (appState.match(/inactive|background/) && nextAppState === "active") {
            BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
                console.log("ConnectedPeripherals", peripheralsArray);
            })
            setAppState(nextAppState);
        }
    }

    const handleDisconnectedPeripheral = (data) => {
        let local = peripherals;
        let peripheral = local.get(data.peripheral);
        if (peripheral) {
            peripheral.connected = false;
            local.set(peripheral.id, peripheral);
            setPeripherals(local);
        }
    }

    const handleUpdateValueForCharacteristic = (data) => {
        console.log(`Received data from '${data.peripheral}' characteristic '${data.characteristic}`, data.value);
    }

    const handleStopScan = () => {
        setScanning(false);
    }

    const startScan = () => {
        if (!scanning) {
            BleManager.scan([], 5, true).then((results) => {
                console.log("scanning...");
                setScanning(true);
            });
        }
    }

    const handleDiscoverPeripheral = (peripheral) => {
        let local = peripherals;

        if (!peripheral.name) {
            peripheral.name = "NO NAME";
        }
        local.set(peripheral.id, peripheral);
        setPeripherals(local);
    }

    const retrieveConnected = () => {
        BleManager.getConnectedPeripherals([]).then((results) => {
            if (results.length == 0) {
                console.log("No Devices Connected");
            }

            let local = peripherals;

            for (let result of results) {
                result.connected = true;
                local.set(result.id, result);
                setPeripherals(local);
            }
        })
    }

    const disconnectDevice = (peripheral) => {
        BleManager.disconnect(peripheral.id).then(() => {
            let local = peripherals;
            let device = local.get(peripheral.id);
            if (device) {
                device.connected = false;
                local.set(peripheral.id, device);
                setPeripherals(local);
            }
        })
    }

    const connectDevice = (peripheral) => {
        BleManager.connect(peripheral.id)
            .then(() => {
                let local = peripherals;
                let device = local.get(peripheral.id);

                if (device) {
                    device.connected = true;
                    local.set(peripheral.id, device);
                    setPeripherals(local);
                }

                BleManager.retrieveServices(peripheral.id)
                    .then((peripheralInfo) => {

                        let convertedCode = convertCodeToByteArray(KEY_CODE);
                        let service = peripheralInfo.services[1]; //NEED TO READ MORE ABOUT SERVICES
                        let characteristic = null; //NEED TO READ MORE ABOUT CHARACTERISTICS

                        for (let item of peripheralInfo.characteristics) {
                            if (item.service === service) {
                                characteristic = item.characteristic;
                            }
                        }
                        BleManager.writeWithoutResponse(peripheral.id, service, characteristic, convertedCode)
                            .then(() => {
                                console.log("Wrote data", convertedCode.join(', '));
                            })
                            .catch(error => console.log("Write Error", error));
                    })
                    .catch(error => console.log("Service Error:", error));
            })
            .catch((error) => console.log("Connection Error", error));
    }

    const convertCodeToByteArray = (code) => {
        let bytes = [];
        for (let index in code) {
            let char = code.charCodeAt(index);
            bytes = bytes.concat([char & 0xff, char / 256 >>> 0]);
        }
        return bytes;
    }

    const test = (peripheral) => {
        if (peripheral) {
            if (peripheral.connected) {
                disconnectDevice(peripheral);
            } else {
                connectDevice(peripheral);
            }
        }
    }

    const renderItem = (item) => {
        const color = item.connected ? 'green' : '#fff';
        return (
            <TouchableHighlight onPress={() => test(item)}>
                <View style={[styles.row, { backgroundColor: color }]}>
                    <Text style={{ fontSize: 12, textAlign: 'center', color: '#333333', padding: 10 }}>{item.name}</Text>
                    <Text style={{ fontSize: 10, textAlign: 'center', color: '#333333', padding: 2 }}>RSSI: {item.rssi}</Text>
                    <Text style={{ fontSize: 8, textAlign: 'center', color: '#333333', padding: 2, paddingBottom: 20 }}>{item.id}</Text>
                </View>
            </TouchableHighlight>
        );
    }

    useEffect(() => {
        AppState.addEventListener("change", handleAppStateChange);
        bleManagerEmitter.addListener("BleManagerStopScan", handleStopScan);
        bleManagerEmitter.addListener("BleManagerDiscoverPeripheral", handleDiscoverPeripheral);
        bleManagerEmitter.addListener("BleManagerDisconnectPeripheral", handleDisconnectedPeripheral);
        bleManagerEmitter.addListener("BleManagerDidUpdateValueForCharacteristic", handleUpdateValueForCharacteristic);
        BleManager.start({ showAlert: false });

        return cleanUp = () => {
            AppState.removeEventListener("change");
            bleManagerEmitter.removeListener("BleManagerStopScan");
            bleManagerEmitter.removeListener("BleManagerDiscoverPeripheral");
            bleManagerEmitter.removeListener("BleManagerDisconnectPeripheral");
            bleManagerEmitter.removeListener("BleManagerDidUpdateValueForCharacteristic");
        }
    }, []);

    const list = Array.from(peripherals.values());
    const btnScanTitle = `Scan Bluetooth (${scanning ? "on" : "off"})`;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.container}>
                <View style={{ margin: 10 }}>
                    <Button title={btnScanTitle} onPress={() => startScan()} />
                </View>

                <View style={{ margin: 10 }}>
                    <Button title="Retrieve connected peripherals" onPress={() => retrieveConnected()} />
                </View>

                {list.length > 0 ?
                    <FlatList
                        data={list}
                        renderItem={({ item }) => renderItem(item)}
                        keyExtractor={item => item.id}
                    />
                    :
                    <View style={{ flex: 1, margin: 20 }}>
                        <Text style={{ textAlign: 'center' }}>No peripherals</Text>
                    </View>
                }
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        width: window.width,
        height: window.height,
    },
    scroll: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        margin: 10,
    },
    row: {
        margin: 10
    },
});