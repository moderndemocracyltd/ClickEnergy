
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

export default BrowserHandler = (props) => {

    const WEBVIEW_REF = useRef();

    const [baseURL, setbaseURl] = useState("");
    const [viewSource, setViewSource] = useState("");

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

    useEffect(() => {

        let prefix = "";
        if (global.__DEV__) {
            prefix = "https://staging.clickenergyni.com";
        } else {
            prefix = "https://www.clickenergyni.com";
        } 
        setbaseURl(prefix);
        setViewSource(`${prefix}/?returnurl=%2fDashboard%2fSummary.aspx`)

        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
        return () => BackHandler.removeEventListener("hardwareBackPress", handleBackButtonClick);
    },
        [baseURL, viewSource]
    );

    return (
        <WebView
            ref={WEBVIEW_REF}
            source={{ uri: viewSource }}
            onNavigationStateChange={handleNavigationChange}
            allowsBackForwardNavigationGestures={true}
            bounces={false}
        />
    );
};
