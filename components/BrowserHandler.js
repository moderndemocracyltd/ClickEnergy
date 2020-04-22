
import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';

const BrowserHandler = (props) => {

    const [baseURL, setURl] = useState("https://www.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx");

    useEffect(() => {
        if (global.__DEV__) {
            setURl("https://staging.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx")
        }
    });

    return (
        <WebView
            source={{ uri: baseURL }}
        />
    );
};

export default BrowserHandler