import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, Modal,
    Button, FlatList, TouchableOpacity,
    TouchableWithoutFeedback, TouchableHighlight, AppState,
    Platform, PermissionsAndroid
} from "react-native";
import BluetoothService from "../Services/BluetoothService";

export default BluetoothHandler = (props) => {
    const KEY_CODE = props?.keyCode || null;
    const [scanning, setScanning] = useState(false);
    const [peripherals, setPeripherals] = useState([]);
    const [appState, setAppState] = useState('');

    useEffect(() => {
        console.log("use effect scanning");
        BluetoothService.isScanning = scanning
    }, [scanning])

    useEffect(() => {
        AppState.addEventListener("change", handleAppStateChange);
        checkConnection();
        setInterval(getConnectedDevices, 5000);

        return cleanUp = () => {
            AppState.removeEventListener("change");
            BluetoothService.stopListening();
        }
    }, []);

    const getConnectedDevices = async () => {
        const peripherals = await BluetoothService.retrieveConnected();
        setPeripherals(peripherals);
    }

    const checkConnection = async () => {
        if (Platform.OS === 'android' && Platform.Version >= 23) {
            const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
            if (result) {
                console.log("Permission is OK");
                BluetoothService.startListening();
            } else {
                const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                if (result) {
                    console.log("User accept");
                    BluetoothService.startListening();
                } else {
                    console.log("User refuse");
                }
            }
        }
        if (Platform.OS === 'ios') {
            BluetoothService.startListening();
        }
    }

    const handleAppStateChange = async nextAppState => {
        try {
            if (appState.match(/inactive|background/) && nextAppState === "active") {
                const peripherals = await BluetoothService.retrieveConnected();
                setPeripherals(peripherals);
                setAppState(nextAppState);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const test = async peripheral => {
        try {
            if (peripheral) {
                if (peripheral.connected) {
                    await BluetoothService.disconnectFromDevice(peripheral);
                } else {
                    const response = await BluetoothService.connectToDevice(peripheral);
                    if (response) {
                        const peripherals = await BluetoothService.retrieveConnected();
                        setPeripherals(peripherals);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    const renderItem = (item) => {
        const color = item.connected ? 'green' : '#fff';
        return (
            <TouchableHighlight onPress={() => test(item)}>
                <View style={[styles.row, { backgroundColor: color }]}>
                    <Text style={styles.deviceName}>{item.name}</Text>
                    <Text style={styles.deviceRSI}>RSSI: {item.rssi}</Text>
                    <Text style={styles.deviceID}>{item.id}</Text>
                    {item.connected &&
                        <Button
                            title="Send Data"
                            onPress={() => BluetoothService.sendDataToDevice(item, "")}
                        />
                    }
                </View>
            </TouchableHighlight>
        );
    }

    const list = BluetoothService.listConnectedDevices();
    const btnScanTitle = `Scan Bluetooth (${scanning ? "on" : "off"})`;

    return (
        <View style={styles.modalBackground}>
            <Modal visible={props.visible} animationType={'slide'} transparent={true}>
                <TouchableOpacity style={styles.opactity}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View>
                                <Button
                                    title={btnScanTitle}
                                    onPress={() => {
                                        setScanning(!scanning);
                                        BluetoothService.startScanning()
                                    }}
                                />
                            </View>
                            <View style={{ margin: 10 }}>
                                <Button
                                    title="Retrieve connected peripherals"
                                    onPress={() => BluetoothService.retrieveConnected()}
                                />
                            </View>
                            {list.length > 0 ?
                                <FlatList
                                    data={list}
                                    renderItem={({ item }) => renderItem(item)}
                                    keyExtractor={item => item.id}
                                />
                                :
                                <View style={{ flex: 1, margin: 20 }}>
                                    <Text style={{ textAlign: 'center' }}>
                                        No peripherals
                                    </Text>
                                </View>
                            }
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    modalBackground: {
        backgroundColor: 'grey',
        height: '100%',
        width: '100%'
    },
    opactity: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    modalContent: {
        borderRadius: 10,
        width: '80%',
        height: '70%',
        backgroundColor: 'white',
    },
    deviceName: {
        fontSize: 12,
        textAlign: 'center',
        color: '#333333',
        padding: 10
    },
    deviceRSI: {
        fontSize: 10, 
        textAlign: 'center', 
        color: '#333333', 
        padding: 2
    },
    deviceID: {
        fontSize: 8, 
        textAlign: 'center', 
        color: '#333333', 
        padding: 2, 
        paddingBottom: 20
    }
});