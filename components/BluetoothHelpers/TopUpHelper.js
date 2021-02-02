import React, { useContext } from 'react';
import { Text, View, StyleSheet, Button, Image } from "react-native";
import { BluetoothContext } from "../../context/BluetoothContext";

import LoadingGif from "../../img/loading.gif";

export default TopUpHelper = props => {
    const { resetFlow } = useContext(BluetoothContext);
    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.text}>Sending Code to Meter</Text>
            </View>
            <View style={styles.content}>
                <Image style={styles.image} source={LoadingGif} />
                <Text>Please wait for the meter to respond.</Text>
            </View>
            <View style={styles.footer}>
                <Button title={"Cancel"} onPress={() => resetFlow()} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        height: '10%',
        padding: '6%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: "center",
        backgroundColor: "#243a47",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    content: {
        padding: 20,
        height: '80%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    image: {
        width: 100,
        height: 100,
        margin: 50
    },
    text: {
        color: 'white'
    },
    footer: {
        height: '10%',
        padding: 5
    }
});