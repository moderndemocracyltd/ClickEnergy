
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, Linking, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-community/react-native-cookies';
import AsyncStorage from '@react-native-community/async-storage';

export default BrowserHandler = (props) => {

    const WEBVIEW_REF = useRef();

    const [baseURL, setbaseURl] = useState("");
    const [viewSource, setViewSource] = useState("");
    const [sessionCookie, setSessionCookie] = useState({});
    const [authCookie, setAuthCookie] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    handlePostMessage = (event) => {
        const { data } = event.nativeEvent;

        props.navigation.navigate('Bluetooth', {
            keyCode: data
        });
        //Handle Event
        //Get Top Up code from event.nativeEvent.data
        //Pass to Bluetooth handler
    }

    handleBackButtonClick = () => {
        WEBVIEW_REF.current.goBack();
        return true;
    }

    handleNavigationChange = async newNavState => {
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

        if (url.includes(baseURL) && url.includes("Payment-Success")) {
            WEBVIEW_REF.current.injectJavaScript(`
                let topUpCode = document.getElementById("");
                window.ReactNativeWebView.postMessage(000004620013459827369);
                true;
            `);
        }

        updateCookies(url);
    }

    updateCookies = (url) => {
        if (Platform.OS === 'ios') {
            updateiOSCookies();
        }
        if (Platform.OS === 'android') {
            updateAndroidCookies(url);
        }
    }

    updateiOSCookies = () => {
        CookieManager.getAll(true).then(async (res) => await update(res));
    }

    updateAndroidCookies = (url) => {
        CookieManager.get(url).then(async (res) => await update(res));
    }

    update = async (res) => {

        let newAuth = res[".ASPXFORMSAUTH"];
        let newSession = res["ASP.NET_SessionId"];

        if (newAuth) {
            if (newAuth !== authCookie) {
                setAuthCookie(newAuth);
                await AsyncStorage.setItem('@auth', JSON.stringify(newAuth));
            }
        } else {
            await AsyncStorage.removeItem('@auth');
            if (Platform.OS === 'ios') {
                await CookieManager.clearByName('.ASPXFORMSAUTH');
            }
        }
        if (newSession && newSession !== sessionCookie) {
            setSessionCookie(newSession);
            await AsyncStorage.setItem('@session', JSON.stringify(newSession));
        }
    }

    readStoredCookie = async () => {
        AsyncStorage.multiGet(['@auth', '@session'])
            .then(async stored => {

                let authPresent = false;

                for (const cookie of stored) {
                    let parsed = JSON.parse(cookie[1]);

                    if (parsed?.name === ".ASPXFORMSAUTH" || (cookie[0] === "@auth" && cookie[1])) {
                        setAuthCookie(parsed);
                        authPresent = true;
                    }
                    if (parsed?.name === "ASP.NET_SessionId" || (cookie[0] === "@session" && cookie[1])) {
                        setSessionCookie(parsed);
                    }
                    if (Platform.OS === 'ios') {
                        await CookieManager.set({
                            name: parsed?.name ? parsed?.name : '',
                            value: parsed?.value ? parsed?.value : '',
                            domain: parsed?.domain ? parsed?.domain : '',
                            origin: parsed?.origin ? parsed?.origin : '',
                            path: parsed?.path ? parsed?.path : '/',
                            version: parsed?.version ? parsed?.version : '1',
                            expiration: parsed?.expiration ? parsed?.expiration : new Date().setHours(new Date().getHours() + 1)
                        })
                    }
                }
                setUpView(authPresent);
                setIsLoading(false);
            });
    }

    setUpView = async (authPresent) => {

        let prefix = "";
        if (global.__DEV__) {
            prefix = "https://staging.clickenergyni.com";
        } else {
            prefix = "https://www.clickenergyni.com";
        }
        setbaseURl(prefix);

        if (authPresent) {
            setViewSource(`${prefix}/Dashboard/Top-Up.aspx`);
        } else {
            await CookieManager.clearAll().then(() => {
                setViewSource(`${prefix}/Dashboard/Summary.aspx`);
            })
        }
    }

    useEffect(() => {

        readStoredCookie();
        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);

        return cleanUp = () => {
            BackHandler.removeEventListener("hardwareBackPress", handleBackButtonClick);
        }
    },
        []
    );

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
