
import React, { Component } from 'react';
import { WebView } from 'react-native-webview';
import { SafeAreaView, Platform } from 'react-native';

class BrowserHandler extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <WebView
                ref={webView => (this.webView = webView)}
                source={{ uri: 'https://www.clickenergyni.com/?returnurl=%2fDashboard%2fSummary.aspx' }}
            />
        );
    }
}

export default BrowserHandler