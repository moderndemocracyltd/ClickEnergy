import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TouchableWithoutFeedback, AppState } from "react-native";

import DeviceList from './BluetoothHelpers/DeviceList';
import TopUpHelper from './BluetoothHelpers/TopUpHelper';
import TopUpSuccessFeedback from "./BluetoothHelpers/TopUpSuccessFeedback";
import TopUpFailedFeedback from './BluetoothHelpers/TopUpFailedFeedback';
import ErrorFeedback from "./BluetoothHelpers/ErrorFeedback";

import BluetoothService from "../Services/BluetoothService";

export default BluetoothHandler = (props) => {
    const KEY_CODE = props?.keyCode || null;

    const [appState, setAppState] = useState('');
    const [scanning, setScanning] = useState(false);
    const [list, setList] = useState([]);

    const [error, setErrorMessage] = useState(null);
    const [showDeviceList, setShowDeviceList] = useState(true);
    const [isToppingUp, setIsToppingUp] = useState(false);
    const [topUpSuccess, setTopUpSuccess] = useState(false);
    const [topUpFailure, setTopUpFailure] = useState(false);

    useEffect(() => {
        AppState.addEventListener("change", handleAppStateChange);
        BluetoothService.setUpListeners();
        BluetoothService.addCallbacks(setScanning, setTopUpSuccess, setTopUpFailure);
        checkPermissions();

        return cleanUp = () => {
            AppState.removeEventListener("change");
            BluetoothService.removeListeners();
        }
    }, []);

    useEffect(() => {
        if (error) {
            setScanning(false);
            setList([]);
            setShowDeviceList(false);
            setIsToppingUp(false);
            setTopUpSuccess(false);
            setTopUpFailure(false);
        }
    }, [error]);

    const checkPermissions = async () => {
        try {
            const hasPermission = await BluetoothService.checkPermission();
            if (hasPermission) {
                setInterval(retrieveDevices, 1000);
            } else {
                setErrorMessage("Bluetooth Permissions not set");
            }
        } catch (error) {
            setErrorMessage(error);
        }
    }

    const retrieveDevices = () => {
        const devices = BluetoothService.getPeripherals();
        setList(Array.from(devices.values()));
    }

    const handleAppStateChange = nextAppState => {
        if (appState.match(/inactive|background/) && nextAppState === "active") {
            retrieveDevices();
            setAppState(nextAppState);
        }
    }

    const connectToDevice = async peripheral => {
        try {
            if (peripheral) {
                BluetoothService.handleStopScan();
                await BluetoothService.connectToDevice(peripheral);
                setShowDeviceList(false);
                setIsToppingUp(true);

                await BluetoothService.sendDataToDevice(peripheral, KEY_CODE);
                setIsToppingUp(false);
                setTopUpSuccess(true);
            }
        } catch (error) {
            setErrorMessage(error);
        }
    }

    const resetFlow = () => {
        setScanning(false);
        setList([]);
        setErrorMessage(null);
        setShowDeviceList(true);
        setIsToppingUp(false);
        setTopUpSuccess(false);
        setTopUpFailure(false);
    }

    const topUpCompletionHandler = async () => {
        try {
            await BluetoothService.disconnectFromMeter();
            BluetoothService.handleStopScan();
            BluetoothService.resetMeterInfo();
            resetFlow();
        } catch (error) {
            setErrorMessage(error);
        }
    }

    return (
        <View style={styles.modalBackground}>
            <Modal visible={props.visible} animationType={'slide'} transparent={true}>
                <TouchableOpacity style={styles.opactity}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            {showDeviceList &&
                                <DeviceList
                                    setScanning={setScanning}
                                    scanning={scanning}
                                    deviceList={list}
                                    connectToDevice={connectToDevice}
                                />
                            }
                            {isToppingUp &&
                                <TopUpHelper
                                    reset={resetFlow}
                                />
                            }
                            {topUpSuccess &&
                                <TopUpSuccessFeedback
                                    completionHandler={topUpCompletionHandler}
                                />
                            }
                            {topUpFailure &&
                                <TopUpFailedFeedback />
                            }
                            {error &&
                                <ErrorFeedback
                                    errorMessage={error}
                                    reset={resetFlow}
                                />
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