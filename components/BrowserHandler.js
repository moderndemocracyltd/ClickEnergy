
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { Linking } from 'react-native';

export default BrowserHandler = (props) => {

    const WEBVIEW_REF = useRef();

    const [baseURL, setbaseURl] = useState("");

    handleBackButtonClick = () => {
        WEBVIEW_REF.current.goBack();
        return true;
    }

    useEffect(() => {

        if (global.__DEV__) {
        //     setbaseURl("https://staging.clickenergyni.com");
        // } else {
            setbaseURl("https://www.clickenergyni.com");
        }

        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
        return () => BackHandler.removeEventListener("hardwareBackPress", handleBackButtonClick);
    },[]);

    handleNavigationChange = async newNavState => {
        const { url } = newNavState;

        if (!url || newNavState.title.includes("about:blank")) return;

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

    return (
        <WebView
            ref={ WEBVIEW_REF }
            source={{ uri: `${baseURL}/?returnurl=%2fDashboard%2fSummary.aspx` }}
            onNavigationStateChange={handleNavigationChange}
        />
    );
};
