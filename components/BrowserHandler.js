
import React from 'react';
import { WebView } from 'react-native-webview';

const BrowserHandler = () => {
    return (
        <WebView
            source={{ uri: 'https://www.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx' }}
        />
    );
};

export default BrowserHandler