import React, { useEffect, useContext } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TouchableWithoutFeedback, } from "react-native";
import { BluetoothContext, BluetoothContextProvider } from "../context/BluetoothContext";

import DeviceList from './BluetoothHelpers/DeviceList';
import TopUpHelper from './BluetoothHelpers/TopUpHelper';
import TopUpSuccessFeedback from "./BluetoothHelpers/TopUpSuccessFeedback";
import TopUpFailedFeedback from './BluetoothHelpers/TopUpFailedFeedback';
import ErrorFeedback from "./BluetoothHelpers/ErrorFeedback";

import Meter from "../Helpers/Meter";

export default BluetoothHandler = (props) => {
    const { keyCode, visible, dismissModal } = props;
    const { showDeviceList, isToppingUp, topUpSuccess, topUpFailure, error } = useContext(BluetoothContext);

    useEffect(() => {
        if (keyCode) {
            Meter.setPackets(keyCode);
        }
    }, [keyCode]);

    return (
        <View style={visible ? styles.modalBackground : {}}>
            <Modal visible={visible} animationType={'slide'} transparent={true}>
                <TouchableOpacity style={styles.opactity} onPress={dismissModal}>
                    <TouchableWithoutFeedback >
                        <BluetoothContextProvider>
                            <View style={styles.modalContent}>
                                {showDeviceList &&
                                    <DeviceList />
                                }
                                {isToppingUp &&
                                    <TopUpHelper />
                                }
                                {topUpSuccess &&
                                    <TopUpSuccessFeedback />
                                }
                                {topUpFailure &&
                                    <TopUpFailedFeedback />
                                }
                                {error &&
                                    <ErrorFeedback />
                                }
                            </View>
                        </BluetoothContextProvider>
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