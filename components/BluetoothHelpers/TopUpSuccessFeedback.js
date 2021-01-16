import React from 'react';
import { Text, View, StyleSheet, Button, Image } from "react-native";

import BluetoothService from "../../Services/BluetoothService";
import SuccessGIF from "../../img/success.gif";

export default TopUpSuccessFeedback = props => {
    const { reset, completionHandler } = props;

    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.text}>Top Up Successful!</Text>
            </View>
            <View style={styles.content}>
                <Image style={styles.image} source={SuccessGIF} />
                <Text>Your current balance is: {BluetoothService.meter.balance}</Text>
            </View>
            <View style={styles.footer}>
                <Button title={"Complete"} onPress={() => completionHandler()} />
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
        width: 200,
        height: 200,
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