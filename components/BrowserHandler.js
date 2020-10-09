
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
        //Get Top Up code from event.nativeEvent.data
        //Pass to Bluetooth handler
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
            WEBVIEW_REF.current.stopLoading();
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                alert(`Can't open link: ${url}`);
            }
        }

        //If user tops up and payment is successful
        if (url.includes(baseURL) && url.includes("Payment-Success")) {
            // Inject javascript into page
            //      window.ReactNativeWebView.postMessage(document.getElementByClassName("TopUpCodeText <p>Tag"));
            // postMessage will trigger onMessage handler (handlePostMessage) within ReactNative with the top up code
            WEBVIEW_REF.current.injectJavaScript(`
                let topUpCode = document.getElementById("TopUpCodePTag").innerHTML;
                window.ReactNativeWebView.postMessage(topUpCode);
                true;
            `);
        }

        await CookieService.updateCookies(url);
    }

    const setUpView = async (authPresent) => {

        const prefix = global.__DEV__ ? "staging" : "www";
        const url = `https://${prefix}.clickenergyni.com`;
        setbaseURl(url);

        if (authPresent) {
            setViewSource(`${url}/Dashboard/Top-Up.aspx`);
        } else {
            await CookieService.clearCookies().then(() => {
                setViewSource(`${url}/Dashboard/Summary.aspx`)
            });
        }
    }

    useEffect(() => {
        CookieService.loadStoredCookies().then(authKeyPresent => {
            setUpView(authKeyPresent);
            setIsLoading(false);
        });

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
                    source={{ uri: viewSource, }}
                    onNavigationStateChange={handleNavigationChange}
                    onMessage={handlePostMessage}
                    allowsBackForwardNavigationGestures={true}
                    bounces={false}
                    cacheEnabled={true}
                    cacheMode={"LOAD_DEFAULT"}
                    sharedCookiesEnabled={true}
                    thirdPartyCookiesEnabled={true}
                />
            }
        </>
    );
};
