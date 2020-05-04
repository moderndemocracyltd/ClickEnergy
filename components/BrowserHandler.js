
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, Linking, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-community/react-native-cookies';
import AsyncStorage from '@react-native-community/async-storage';

export default BrowserHandler = (props) => {

    const WEBVIEW_REF = useRef();

    const [baseURL, setbaseURl] = useState("");
    const [viewSource, setViewSource] = useState("");
    const [sessionCookie, setSessionCookie] = useState("");
    const [authCookie, setAuthCookie] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    
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

        if (!url.includes(baseURL) && !url.includes("https://pay.judopay.com")) {
            WEBVIEW_REF.current.stopLoading();
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                alert(`Can't open link: ${url}`);
            }
        }

        await updateCookies();
    }

    updateCookies = async () => {
        await CookieManager
            .getAll(true)
            .then(async (res) => {

                let newAuth = res[".ASPXFORMSAUTH"];
                let newSession = res["ASP.NET_SessionId"];

                if (newAuth && newAuth !== authCookie) {
                    setAuthCookie(newAuth);
                    await AsyncStorage.setItem('@auth', JSON.stringify(newAuth));
                }
                if (newSession && newSession !== sessionCookie) {
                    setSessionCookie(newSession);
                    await AsyncStorage.setItem('@session', JSON.stringify(newSession));
                }
            });
    }

    readStoredCookie = async () => {
        await AsyncStorage
            .multiGet(['@auth', '@session'])
            .then(async stored => {

                for (const cookie of stored) {

                    let parsed = JSON.parse(cookie[1]);

                    await CookieManager.set({
                        name: parsed.name ? parsed.name : '',
                        value: parsed.value ? parsed.value : '',
                        domain: parsed.domain ? parsed.domain : '',
                        origin: parsed.origin ? parsed.origin : '',
                        path: parsed.path ? parsed.path : '/',
                        version: parsed.version ? parsed.version : '1',
                        expiration: parsed.expiration ? parsed.expiration : '2050-01-30T12:30:00.00-05:00'
                    })
                }
                setIsLoading(false);
            });
    }

    useEffect(() => {
        //Read cookies status before setting url
        //---------------------------------------
        //auth
        //www.clickenergyni.com/Dashboard/Top-Up.aspx
        //no auth
        //www.clickenergyni.com/Dashboard/Summary.aspx

        readStoredCookie();

        let prefix = "";
        if (global.__DEV__) {
            //     prefix = "https://staging.clickenergyni.com";
            // } else {
            prefix = "https://www.clickenergyni.com";
        }
        setbaseURl(prefix);
        setViewSource(`${prefix}/Dashboard/Top-Up.aspx`);
        
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
