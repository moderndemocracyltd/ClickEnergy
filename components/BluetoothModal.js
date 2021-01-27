import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TouchableWithoutFeedback, AppState } from "react-native";

import DeviceList from './BluetoothHelpers/DeviceList';
import TopUpHelper from './BluetoothHelpers/TopUpHelper';
import TopUpSuccessFeedback from "./BluetoothHelpers/TopUpSuccessFeedback";
import TopUpFailedFeedback from './BluetoothHelpers/TopUpFailedFeedback';
import ErrorFeedback from "./BluetoothHelpers/ErrorFeedback";

import BluetoothService from "../Services/BluetoothService";
import Meter from "../Helpers/Meter";

export default BluetoothHandler = (props) => {
    const { keyCode, visible, dismissModal } = props;
    const [appState, setAppState] = useState('');

    const [showDeviceList, setShowDeviceList] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [list, setList] = useState([]);

    const [meterConnected, setMeterConnected] = useState(false);
    const [isTransparent, setIsTransparent] = useState(false);
    const [startTopUp, setStartTopUp] = useState(false);

    const [isToppingUp, setIsToppingUp] = useState(false);
    const [topUpSuccess, setTopUpSuccess] = useState(false);
    const [topUpFailure, setTopUpFailure] = useState(false);
    const [error, setErrorMessage] = useState(null);

    useEffect(() => {
        AppState.addEventListener("change", handleAppStateChange);
        BluetoothService.setUpListeners();
        BluetoothService.addCallbacks(
            setScanning,
            setIsTransparent,
            setStartTopUp,
            setTopUpSuccess,
            setTopUpFailure
        );

        checkPermissions();
        return cleanUp = () => {
            AppState.removeEventListener("change");
            BluetoothService.removeListeners();
        }
    }, []);

    useEffect(() => { handleMeterConnection() }, [meterConnected]);
    useEffect(() => { handleIsTransparent() }, [isTransparent]);
    useEffect(() => { handleStartTopUp() }, [startTopUp]);
    useEffect(() => { handleErrorMessage() }, [error]);

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

    const handleMeterConnection = async () => {
        try {
            if (meterConnected) {
                console.log("Meter Connected");
                setShowDeviceList(false);
                setIsToppingUp(true);
                await BluetoothService.sendTransparentMessageToMeter()
            }
        } catch (error) {
            setErrorMessage(error);
        }
    }

    const handleErrorMessage = () => {
        if (error) {
            setScanning(false);
            setList([]);
            setShowDeviceList(false);
            setIsToppingUp(false);
            setTopUpSuccess(false);
            setTopUpFailure(false);
        }
    }

    const handleIsTransparent = async () => {
        try {
            if (isTransparent) {
                console.log("Meter is Transparent");
                await BluetoothService.sendTopUpRequest();
            }
        } catch (error) {
            setErrorMessage(error);
        }
    }

    const handleStartTopUp = async () => {
        try {
            if (startTopUp) {
                console.log("Meter is Ready for Top Up");
                Meter.setPackets(keyCode);
                await BluetoothService.startTopUp();
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

    const resetFlow = async () => {
        await BluetoothService.killTransparentMode();
        await BluetoothService.stopNotifying();
        await BluetoothService.handleStopScan();
        await BluetoothService.disconnectFromMeter();
        
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
            await BluetoothService.handleStopScan();
            Meter.resetMeterInfo();
            resetFlow();
        } catch (error) {
            setErrorMessage(error);
        }
    }

    return (
        <View style={visible ? styles.modalBackground : {}}>
            <Modal visible={visible} animationType={'slide'} transparent={true}>
                <TouchableOpacity style={styles.opactity} onPress={dismissModal}>
                    <TouchableWithoutFeedback >
                        <View style={styles.modalContent}>
                            {showDeviceList &&
                                <DeviceList
                                    setScanning={setScanning}
                                    scanning={scanning}
                                    deviceList={list}
                                    setError={setErrorMessage}
                                    setMeterConnected={setMeterConnected}
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
                                <TopUpFailedFeedback

                                />
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