import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableHighlight,
    NativeEventEmitter,
    NativeModules,
    Platform,
    PermissionsAndroid,
    ScrollView,
    AppState,
    FlatList,
    Dimensions,
    Button,
    SafeAreaView
} from "react-native";
import BleManager from "react-native-ble-manager";

export default BluetoothHandler = (props) => {

    const BleManagerModule = NativeModules.BleManager;
    const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

    const [appState, setAppState] = useState('');
    const [peripherals, setPeripherals] = useState(new Map());
    const [scanning, setScanning] = useState(false);

    handleAppStateChange = (nextAppState) => {
        if (appState.match(/inactive|background/) && nextAppState === "active") {
            BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
                console.log("ConnectedPeripherals", peripheralsArray);
            })
            setAppState(nextAppState);
        }
    }

    handleDisconnectedPeripheral = (data) => {
        let local = peripherals;
        let peripheral = local.get(data.peripheral);
        if (peripheral) {
            peripheral.connected = false;
            local.set(peripheral.id, peripheral);
            setPeripherals(local);
        }
    }

    handleUpdateValueForCharacteristic = (data) => {
        console.log(`Received data from '${data.peripheral}' characteristic '${data.characteristic}`, data.value);
    }

    handleStopScan = () => {
        setScanning(false);
    }

    startScan = () => {
        if (!scanning) {
            BleManager.scan([], 3, true).then((results) => {
                console.log("scanning...");
                setScanning(true);
            });
        } else {
            setScanning(false);
        }
    }

    handleDiscoverPeripheral = (peripheral) => {
        let local = peripherals;

        if (!peripheral.name) {
            peripheral.name = "NO NAME";
        }
        local.set(peripheral.id, peripheral);
        setPeripherals(local);
    }

    retrieveConnected = () => {
        BleManager.getConnectedPeripherals([]).then((results) => {
            if (results.length == 0) {
                console.log("No Devices Connected");
            }

            let local = peripherals;

            for (let result of results) {
                result.connected = true;
                local.set(peripheral.id, peripheral);
                setPeripherals(local);
            }
        })
    }

    renderItem = (item) => {
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

    test = (peripheral) => {
        if (peripheral) {
            if (peripheral.connected) {
                BleManager.disconnect(peripheral.id);
            } else {
                BleManager.connect(peripheral.id).then(() => {
                    let local = peripherals;
                    let p = local.get(peripheral.id);
                    if (p) {
                        p.connected = true;
                        local.set(peripheral.id);
                        setPeripherals(local);
                    }

                    console.log(props?.route?.params?.keyCode);
                    alert(`Connected ${props?.route?.params?.keyCode}`);

                    // setTimeout(() => {
                    //     BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
                    //         var service = '13333333-3333-3333-3333-333333333337';
                    //         var bakeCharacteristic = '13333333-3333-3333-3333-333333330003';
                    //         var crustCharacteristic = '13333333-3333-3333-3333-333333330001';

                    //         setTimeout(() => {
                    //             BleManager.startNotification(peripheral.id, service, bakeCharacteristic).then(() => {
                    //                 setTimeout(() => {
                    //                     BleManager.write(peripheral.id, service, crustCharacteristic, [0]).then(() => {
                    //                         BleManager.write(peripheral.id, service, bakeCharacteristic, [1, 95]).then(() => {
                    //                             console.log("Finished?");
                    //                         })
                    //                     })
                    //                 }, 500);
                    //             }).catch((error) => {
                    //                 console.log("Notification Error", error);
                    //             });
                    //         }, 200);
                    //     });
                    // }, 900);
                }).catch((error) => {
                    console.log("Connection Error", error);
                });
            }
        }
    }

    useEffect(() => {
        AppState.addEventListener("change", handleAppStateChange);
        BleManager.start({ showAlert: false });
        this.handlerDiscover = bleManagerEmitter.addListener("BleManagerDiscoverPeripheral", handleDiscoverPeripheral);
        this.handlerStop = bleManagerEmitter.addListener("BleManagerStopScan", handleStopScan);
        this.handlerDisconnect = bleManagerEmitter.addListener("BleManagerDisconnectPeripheral", handleDisconnectedPeripheral);
        this.handlerUpdate = bleManagerEmitter.addListener("BleManagerDidUpdateValueForCharacteristic", handleUpdateValueForCharacteristic);

        return cleanUp = () => {
            this.handlerDiscover.remove();
            this.handlerStop.remove();
            this.handlerDisconnect.remove();
            this.handlerUpdate.remove();
        }
    },
        []
    )

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

                <ScrollView style={styles.scroll}>
                    {(list.length == 0) &&
                        <View style={{ flex: 1, margin: 20 }}>
                            <Text style={{ textAlign: 'center' }}>No peripherals</Text>
                        </View>
                    }
                    <FlatList
                        data={list}
                        renderItem={({ item }) => renderItem(item)}
                        keyExtractor={item => item.id}
                    />

                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        width: window.width,
        height: window.height
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