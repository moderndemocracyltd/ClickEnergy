
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, Linking, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import CookieService from '../Services/CookieService';

export default BrowserHandler = (props) => {

    const WEBVIEW_REF = useRef();
    const [baseURL, setbaseURl] = useState("");
    const [viewSource, setViewSource] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const handlePostMessage = (event) => {
        const { data } = event.nativeEvent;
        props.navigation.navigate('Bluetooth', {
            keyCode: data
        });
    }

    const displayError = () => {
        Alert.alert("Error", "An error has occured. Tap OK to go back",
            [{
                text: 'OK',
                onPress: () => WEBVIEW_REF.current.goBack()
            }],
            { cancelable: false }
        );
    }

    const openLinkExternally = async (url) => {
        WEBVIEW_REF.current.stopLoading();
        WEBVIEW_REF.current.goBack();
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            alert(`Can't open link: ${url}`);
        }
    }

    const handleBackButtonClick = () => {
        WEBVIEW_REF.current.goBack();
        return true;
    }

    const handleNavigationChange = async newNavState => {
        const { url, title } = newNavState;

        if (title === "about:blank") {
            WEBVIEW_REF.current.goForward();
            return;
        }
        if (!url.includes(baseURL) && !url.includes("judopay")) {
            openLinkExternally(url);
        }

        if (url.includes(baseURL) && url.includes("Payment-Success")) {
            // WEBVIEW_REF.current.injectJavaScript(`
            //     let topUpCode = document.getElementById("TopUpCodePTag").innerHTML;
            //     window.ReactNativeWebView.postMessage(topUpCode);
            //     true;
            // `);
        }
        await CookieService.updateCookies(url);
    }

    const setUpView = async () => {
        const prefix = global.__DEV__ ? "staging" : "www";
        const url = `https://${prefix}.clickenergyni.com`;
        setbaseURl(url);

        const authPresent = await CookieService.loadStoredCookies(url)
        if (authPresent) {
            setViewSource(`${url}/Dashboard/Top-Up.aspx`);
        } else {
            await CookieService.clearCookies().then(() => {
                setViewSource(`${url}/Dashboard/Summary.aspx`)
            });
        }

        setIsLoading(false);
    }

    useEffect(() => {
        setUpView()
        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);

        return cleanUp = () => {
            BackHandler.removeEventListener("hardwareBackPress");
        }
    }, []);

    return (
        <>
            {isLoading &&
                <ActivityIndicator
                    style={{
                        flex: 1,
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        position: 'absolute',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
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
        </>
    );
};
