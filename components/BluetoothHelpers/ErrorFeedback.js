import React from 'react';
import { Text, View, StyleSheet, Button } from "react-native";

export default ErrorFeedback = props => {
    const { errorMessage, reset } = props;
    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.text}>An Error has occured...</Text>
            </View>
            <Text style={styles.content}>{errorMessage}</Text>
            <View style={styles.footer}>
                <Button title={"Retry"} onPress={() => reset()} />
            </View>
        </View>
    )
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
    content: {
        padding: 20,
        height: '80%'
    },
    text: {
        color: 'white'
    },
    footer: {
        height: '10%',
        padding: 5
    }
});