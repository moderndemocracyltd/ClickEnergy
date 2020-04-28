
import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

const BrowserHandler = (props) => {

    const [baseURL, setbaseURl] = useState("");
    const WEBVIEW_REF = React.createRef();

    handleBackButtonClick = () => {
        WEBVIEW_REF.current.goBack(null);
        return true;
    }

    useEffect(() => {

        if (global.__DEV__) {
        //     setbaseURl("https://staging.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx");
        // } else {
            setbaseURl("https://www.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx");
        }

        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
        return () => BackHandler.removeEventListener("hardwareBackPress", handleBackButtonClick);

    },[]);

    return (
        <WebView
            source={{ uri: baseURL }}
            ref={ WEBVIEW_REF }
        />
    );
};

export default BrowserHandler