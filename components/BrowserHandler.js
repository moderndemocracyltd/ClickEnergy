
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-community/react-native-cookies';
import AsyncStorage from '@react-native-community/async-storage';


export default BrowserHandler = (props) => {

    const WEBVIEW_REF = useRef();

    const [baseURL, setbaseURl] = useState("");
    const [viewSource, setViewSource] = useState("");
    const [sessionCookie, setSessionCookie] = useState("");
    const [authCookie, setAuthCookie] = useState("");

    handleBackButtonClick = () => {
        WEBVIEW_REF.current.goBack();
        return true;
    }

    handleNavigationChange = async newNavState => {
        const { url, title } = newNavState;

        if (WEBVIEW_REF.current) {
            const cookies = await CookieManager.get(url, true);
            //console.log(cookies, cookies[".ASPXFORMSAUTH"])
            persistCookies(cookies);
        }

        if (title === "about:blank") {
            WEBVIEW_REF.current.goForward();
            return;
        }

        if (!url.includes(baseURL)) {
            WEBVIEW_REF.current.stopLoading();
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                alert(`Can't open link: ${url}`);
            }
        }
    }

    persistCookies = async (cookies) => {
        if (cookies["ASP.NET_SessionId"]) {
            await AsyncStorage.setItem('@session', cookies["ASP.NET_SessionId"]);
            console.log("session saved");
        }
        if (cookies[".ASPXFORMSAUTH"]) {
            await AsyncStorage.setItem('@auth', cookies[".ASPXFORMSAUTH"]);
            console.log("auth saved");
        }
    }

    readCookies = async () => {
        let session= await AsyncStorage.getItem('@session');
        let auth = await AsyncStorage.getItem('@auth');
        if(session){
            setSessionCookie(session)
        }
        if(auth){
            setAuthCookie(auth)
        }
    }

    useEffect(() => {

        let prefix = "";
        if (global.__DEV__) {
            //     prefix = "https://staging.clickenergyni.com";
            // } else {
            prefix = "https://www.clickenergyni.com";
        }
        setbaseURl(prefix);
        setViewSource(`${prefix}/Dashboard/Summary.aspx`)
        readCookies()

        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
        return () => BackHandler.removeEventListener("hardwareBackPress", handleBackButtonClick);
    },
        [viewSource, sessionCookie, authCookie]
    );

    return (
        <WebView
            ref={WEBVIEW_REF}
            source={{
                uri: viewSource,
                // headers: {
                //     Cookie: 
                //     `ASP.NET_SessionId=${sessionCookie}; 
                //     .ASPXFORMSAUTH=${authCookie};`
                // }
            }}
            onNavigationStateChange={handleNavigationChange}
            allowsBackForwardNavigationGestures={true}
            bounces={false}
            cacheEnabled={true}
            cacheMode={"LOAD_DEFAULT"}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
        />
    );
};
