/**
 * @format
 * @flow strict-local
 */

import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import BrowserHandler from "./components/BrowserHandler";

const Stack = createStackNavigator();

const App = () => {
  return (
    <>
      <StatusBar
        backgroundColor="#243a47"
        barStyle="light-content"
      />
      <SafeAreaView
        style={{ backgroundColor: '#243a47' }}
      />
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
};

export default App;
