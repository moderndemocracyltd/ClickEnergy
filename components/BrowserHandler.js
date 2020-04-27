
import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { Linking } from 'react-native';

const BrowserHandler = (props) => {

    webView = null;

    const [baseURL, setbaseURl] = useState("");

    useEffect(() => {
        if (global.__DEV__) {
            setbaseURl("https://staging.clickenergyni.com");
        } else {
            setbaseURl("https://www.clickenergyni.com");
        }
    }, []);

    const handleNavigationChange = async newNavState => {
        const { url } = newNavState;

        if (!url || newNavState.title.includes("about:blank")) return;

        if (!url.includes(baseURL)) {
            this.webView.stopLoading();
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
            ref={ref => this.webView = ref}
            source={{ uri: `${baseURL}/?returnurl=%2fDashboard%2fSummary.aspx` }}
            onNavigationStateChange={handleNavigationChange}
        />
    );
};

export default BrowserHandler