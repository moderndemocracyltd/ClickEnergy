import React from 'react';
import { Text, View, StyleSheet, Button, Image } from "react-native";

export default ErrorFeedback = props => {
    const { errorMessage, reset } = props;
    return (
        <View>
            <View style={styles.header}>
                <Image style={styles.image} source={require('../../img/error.png')}/>
                <Text style={styles.text}>An Error has occured.</Text>
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
        height: '80%'
    },
    image: {
        width: 30,
        height: 30,
        marginRight: 40
    },
    text: {
        color: 'white'
    },
    footer: {
        height: '10%',
        padding: 5
    }
});