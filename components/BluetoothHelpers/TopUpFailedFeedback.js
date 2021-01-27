import React from 'react';
import { Text, View, StyleSheet, Button, Image } from "react-native";

export default TopUpFailedFeedback = props => {
    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.text}>Top Up Code Rejected!</Text>
            </View>
            <View style={styles.content}>
                <Text>Top Up Code has been Rejected.</Text>
            </View>
            <View style={styles.footer}>
                <Button title={"Complete"} onPress={() => {}} />
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
    text: {
        color: 'white'
    },
    footer: {
        height: '10%',
        padding: 5
    }
});