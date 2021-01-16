
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, Linking, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import CookieService from '../Services/CookieService';
import BluetoothHandler from "./BluetoothModal";

export default BrowserHandler = props => {

    const WEBVIEW_REF = useRef();
    const [baseURL, setbaseURl] = useState("");
    const [viewSource, setViewSource] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(true); // KEEP TRUE to test bluetooth Modal/connection without having to top-up
    const [KEY_CODE, setKeyCode] = useState(null);

    useEffect(() => {
        setUpView();
        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);

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
        setKeyCode(data);
        setModalVisible(true);
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

    const handleNavigationChange = async newNavState => {
        try {
            const { url, title } = newNavState;

            if (title === "about:blank") {
                WEBVIEW_REF.current.goForward();
                return;
            }
            if (!url.includes(baseURL) && !url.includes("judopay")) {
                await openLinkExternally(url);
            }

            if (url.includes(baseURL) && url.includes("Payment-Success")) {
                const js = `
                (function(){
                    const keyCode = document.getElementById('');
                    window.ReactNativeWebView.postMessage(keyCode);
                    true;
                })()`
                WEBVIEW_REF.current.injectJavaScript(js);
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
            {!isLoading && !modalVisible &&
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
            {!isLoading && modalVisible &&
                <BluetoothHandler
                    visible={modalVisible}
                    keyCode={KEY_CODE}
                />
            }
        </>
    );
};