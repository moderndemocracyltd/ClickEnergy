
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-community/cookies';

export default BrowserHandler = (props) => {

    const [baseURL, setbaseURl] = useState("");
    const WEBVIEW_REF = useRef();

    handleBackButtonClick = () => {
        WEBVIEW_REF.current.goBack(null);
        return true;
    }

    CookieManager.setFromResponse(
        'https://www.clickenergyni.com/Dashboard/Summary.aspx',
        'user_session=abcdefg; path=/; expires=Thu, 1 Jan 2030 00:00:00 -0000; secure; HttpOnly')
        .then((res) => {
            // `res` will be true or false depending on success.
            console.log('CookieManager.setFromResponse =>', res);
        });

    CookieManager.get('https://www.clickenergyni.com/Dashboard/Summary.aspx')
        .then((res) => {
            console.log('CookieManager.get =>', res); // => 'user_session=abcdefg; path=/;'
        });

    useEffect(() => {

        if (global.__DEV__) {
            //     setbaseURl("https://staging.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx");
            // } else {
            setbaseURl("https://www.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx");
        }

        BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
        return () => BackHandler.removeEventListener("hardwareBackPress", handleBackButtonClick);

    }, []);

    return (
        <WebView
            source={{ uri: baseURL }}
            ref={WEBVIEW_REF}
        />
    );
};
