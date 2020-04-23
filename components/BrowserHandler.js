
import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';

const BrowserHandler = (props) => {

    const [baseURL, setbaseURl] = useState("");

    useEffect(() => {
        if (global.__DEV__) {
            setbaseURl("https://staging.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx");
        } else {
            setbaseURl("https://www.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx");
        }
    },[]);

    return (
        <WebView
            source={{ uri: baseURL }}
        />
    );
};

export default BrowserHandler