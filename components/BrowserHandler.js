
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, Linking, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import CookieService from '../Services/CookieService';
import BluetoothHandler from "./BluetoothModal";

export default BrowserHandler = props => {

    const WEBVIEW_REF = useRef();
    const [baseURL, setbaseURl] = useState("");
    const [viewSource, setViewSource] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false); // KEEP TRUE to test bluetooth Modal/connection without having to top-up
    const [KEY_CODE, setKeyCode] = useState(null);

    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    useEffect(() => {
        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
        setUpView();
        return cleanUp = () => {
            BackHandler.removeEventListener("hardwareBackPress");
        }
    }, []);

    const setUpView = async () => {
        const prefix = global.__DEV__ ? "staging" : "www";
        const url = `https://${prefix}.clickenergyni.com`;
        setbaseURl(url);

        const authPresent = await CookieService.loadStoredCookies(url);
        if (authPresent) {
            setViewSource(`${url}/Dashboard/Top-Up.aspx`);
        } else {
            await CookieService.clearCookies();
            setViewSource(`${url}/Dashboard/Summary.aspx`);
        }

        setIsLoading(false);
    }

    const handleBackButtonClick = () => {
        WEBVIEW_REF.current.goBack();
        return true;
    }

    const handlePostMessage = event => {
        const { data } = event.nativeEvent;
        console.log(data);
        setKeyCode(data);
        showModal();
    }

    const displayError = () => {
        Alert.alert("Error", "An error has occured. Tap OK to go back",
            [{ text: 'OK', onPress: () => WEBVIEW_REF.current.goBack() }],
            { cancelable: false }
        );
    }

    const openLinkExternally = async url => {
        try {
            WEBVIEW_REF.current.stopLoading();
            WEBVIEW_REF.current.goBack();
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error(error);
            alert(`Can't open link: ${url}`);
        }
    }

    const startBluetoothTopUp = () => {
        WEBVIEW_REF.current.injectJavaScript(`
        const keyCode = document.getElementById('TUC').innerHTML;
        window.ReactNativeWebView.postMessage(keyCode);
        true;
    `)
    }

    const displayTopUpAlert = () => {
        Alert.alert("Bluetooth Top Up", "Would you like to send your Top Up code to your meter via Bluetooth?",
            [
                { text: 'Yes', onPress: () => startBluetoothTopUp() },
                { text: 'No', onPress: () => { } }
            ]
        );
    }

    const handleNavigationChange = async newNavState => {
        try {
            const { url, title, loading } = newNavState;
            if (title === "about:blank") {
                WEBVIEW_REF.current.goForward();
                return;
            }
            if (!url.includes(baseURL) && !url.includes("judopay")) {
                await openLinkExternally(url);
            }
            if (url.includes(baseURL) && !loading && title === 'Click Energy - Payment Success') {
                displayTopUpAlert();
            }
            await CookieService.saveCookies(url);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <>
            {isLoading &&
                <ActivityIndicator
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, }}
                    size="large"
                />
            }
            {!isLoading &&
                <WebView
                    ref={WEBVIEW_REF}
                    useWebKit={true}
                    source={{ uri: viewSource }}
                    bounces={false}
                    cacheEnabled={true}
                    originWhitelist={['*']}
                    cacheMode={"LOAD_DEFAULT"}
                    sharedCookiesEnabled={true}
                    thirdPartyCookiesEnabled={true}
                    allowsBackForwardNavigationGestures={true}
                    onError={displayError}
                    onMessage={handlePostMessage}
                    onNavigationStateChange={handleNavigationChange}
                />
            }
            <BluetoothHandler
                visible={modalVisible}
                dismissModal={hideModal}
                keyCode={KEY_CODE}
            />
        </>
    );
};