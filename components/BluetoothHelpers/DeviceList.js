import React, { useState, useEffect } from 'react';
import {
    Text, View, StyleSheet,
    Button, FlatList, TouchableHighlight,
} from "react-native";
import BluetoothService from '../../Services/BluetoothService';

export default DeviceList = props => {
    const { scanning, deviceList, connectToDevice } = props;

    return (
        <View style={styles.deviceList}>
            <View style={styles.header}>
                <Text style={styles.text}>{scanning ? "Searching..." : "Search for near by meters"}</Text>
            </View>
            <View style={styles.content}>
                {deviceList.length > 0 ?
                    <FlatList
                        data={deviceList}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <PeripheralItem
                                peripheral={item}
                                connectToPeripheral={connectToDevice}
                            />
                        )}
                    />
                    :
                    <View style={{ padding: 5 }}>
                        <Text style={{ textAlign: 'center' }}>No Devices Found</Text>
                    </View>
                }
            </View>
            <View style={styles.footer}>
                {!scanning &&
                    <Button
                        title={"Search"}
                        onPress={() => BluetoothService.startScanning()}
                    />
                }
            </View>
        </View >
    )
}

const PeripheralItem = props => {
    const { peripheral, connectToPeripheral } = props;
    return (
        <TouchableHighlight onPress={() => connectToPeripheral(peripheral)}>
            <View style={styles.item}>
                <Text>{`Device Name: ${peripheral.name}`}</Text>
            </View>
        </TouchableHighlight>
    );
}

const styles = StyleSheet.create({
    header: {
        height: '10%',
        paddingTop: '6%',
        display: 'flex',
        alignItems: "center",
        backgroundColor: "#243a47",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    text: {
        color: 'white'
    },
    content: {
        padding: 20,
        height: '80%'
    },
    deviceList: {
        borderRadius: 10,
        backgroundColor: 'white',
    },
    item: {
        fontSize: 14,
        display: 'flex',
        alignItems: "center",
        color: '#333333',
        padding: 10,
        backgroundColor: '#E8E8E8',
        borderRadius: 10
    },
    footer: {
        height: '10%',
        padding: 5
    }
});