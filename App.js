/**
 * @format
 * @flow strict-local
 */

import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BrowserHandler from "./components/BrowserHandler";
import { SafeAreaView, Platform, StatusBar, View } from 'react-native'

const Stack = createStackNavigator();

class App extends Component {

  componentDidMount(){
    StatusBar.setBarStyle('light-content', true);
  }

  render() {
    return (
      <>
        <SafeAreaView style={{ flex: 0, backgroundColor: '#243a47' }} />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Browser">

            <Stack.Screen
              name="Browser"
              component={BrowserHandler}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </>
    );
  }
};

export default App;
