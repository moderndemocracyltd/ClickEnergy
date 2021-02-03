import React, { createContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import BluetoothService from '../Services/BluetoothService';
import Meter from "../Helpers/Meter";

export const BluetoothContext = createContext({
    appState: '',
    showDeviceList: true,
    scanning: false,
    list: [],
    meterConnected: false,
    isTransparent: false,
    startTopUp: false,
    isToppingUp: false,
    topUpSuccess: false,
    topUpFailure: false,
    error: null
});

const useBluetoothContext = () => {
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
        BluetoothService.addCallbacks({
            setScanning,
            setIsTransparent,
            setStartTopUp,
            setTopUpSuccess,
            setTopUpFailure
        });

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

    const connectToDevice = async peripheral => {
        try {
            if (peripheral) {
                await BluetoothService.handleStopScan();
                await BluetoothService.connectToDevice(peripheral);
                if (Meter.getIsConnected()) {
                    console.log("MeterConnected!!");
                    setMeterConnected(true);
                }
            }
        } catch (error) {
            setErrorMessage(error);
        }
    }

    const checkPermissions = async () => {
        try {
            const hasPermission = await BluetoothService.checkPermission();
            hasPermission
                ? setInterval(retrieveDevices, 1000)
                : setErrorMessage("Bluetooth Permissions not set");
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

    const topUpSuccessHandler = () => setTopUpSuccess(true);
    const toppingUpHandler = () => isToppingUp(true);

    return {
        showDeviceList,
        scanning,
        list,
        isToppingUp,
        topUpSuccess,
        topUpFailure,
        error,
        connectToDevice,
        resetFlow,
        topUpCompletionHandler,
        setIsTransparent,
        setStartTopUp,
        setTopUpSuccess,
        setTopUpFailure,
        setScanning
    }
}

export const BluetoothContextProvider = ({ children }) => {
    const value = useBluetoothContext();
    return (
        <BluetoothContext.Provider value={value}>
            {children}
        </BluetoothContext.Provider>
    );
}