import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, Modal, Button, FlatList, TouchableOpacity,
    TouchableWithoutFeedback, TouchableHighlight, AppState,
} from "react-native";
import BluetoothService from "../Services/BluetoothService";

export default BluetoothHandler = (props) => {

    const KEY_CODE = props?.keyCode || null;
    const [visible, setVisible] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [appState, setAppState] = useState('');

    useEffect(() => {
        console.log("use effect scanning");
        BluetoothService.isScanning = scanning
    }, [scanning])

    useEffect(() => {
        AppState.addEventListener("change", handleAppStateChange);
        BluetoothService.startListening();

        return cleanUp = () => {
            AppState.removeEventListener("change");
            BluetoothService.stopListening();
        }
    }, []);

    const handleAppStateChange = async nextAppState => {
        try {
            if (appState.match(/inactive|background/) && nextAppState === "active") {
                const peripherals = await BluetoothService.retrieveConnected();
                console.log("ConnectedPeripherals", peripherals);
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
                    await BluetoothService.connectToDevice(peripheral);
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
                    <Text style={{ fontSize: 12, textAlign: 'center', color: '#333333', padding: 10 }}>{item.name}</Text>
                    <Text style={{ fontSize: 10, textAlign: 'center', color: '#333333', padding: 2 }}>RSSI: {item.rssi}</Text>
                    <Text style={{ fontSize: 8, textAlign: 'center', color: '#333333', padding: 2, paddingBottom: 20 }}>{item.id}</Text>
                </View>
            </TouchableHighlight>
        );
    }

    const list = BluetoothService.listConnectedDevices();
    const btnScanTitle = `Scan Bluetooth (${scanning ? "on" : "off"})`;

    return (
        <View style={styles.modalBackground}>
            <Modal visible={visible} animationType={'slide'} transparent={true}>
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
    }
});