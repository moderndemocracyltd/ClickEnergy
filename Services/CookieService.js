//import React, { useEffect, useState, useRef } from 'react';
import CookieManager from '@react-native-community/react-native-cookies';
import StorageService from './LocalStorageService';

class CookieService {

    constructor() {
        this.manager = new CookieManager()
        this.authCookie = null;
        this.sessionCookie = null;
        this.AUTH_KEY_NAME = ".ASPXFORMSAUTH";
        this.SESSION_KEY_NAME = "ASP.NET_SessionId";
    }

    loadStoredCookies = async () => {
        return new Promise((resolve, reject) => {
            StorageService
                .getMultipleValues([AUTH_KEY_NAME, SESSION_KEY_NAME])
                .then(async stored => {

                    let authPresent = false;

                    for (const cookie of stored) {
                        const parsed = JSON.parse(cookie[1]);

                        if (parsed?.name === AUTH_KEY_NAME || (cookie[0] === AUTH_KEY_NAME && cookie[1])) {
                            this.authCookie = parsed;
                            authPresent = true;
                        }
                        if (parsed?.name === SESSION_KEY_NAME || (cookie[0] === SESSION_KEY_NAME && cookie[1])) {
                            this.sessionCookie = parsed;
                        }

                        if (Platform.OS === 'ios') {
                            await CookieManager.set({
                                name: parsed?.name || '',
                                value: parsed?.value || '',
                                domain: parsed?.domain || '',
                                origin: parsed?.origin || '',
                                path: parsed?.path || '/',
                                version: parsed?.version || '1',
                                expiration: parsed?.expiration || new Date().setHours(new Date().getHours() + 1)
                            })
                        }
                        resolve(authPresent);
                    }
                }).catch(error => reject(error));
        });
    }

    updateCookies = async (url) => {
        return new Promise((resolve, reject) => {
            CookieManager
                .get(url, true)
                .then(async (response) => {

                    const newAuth = response[AUTH_KEY_NAME];
                    const newSession = response[SESSION_KEY_NAME];

                    if (newAuth) {
                        if (newAuth !== this.authCookie) {
                            this.authCookie = newAuth;
                            await StorageService.setValue(AUTH_KEY_NAME, newAuth);
                        }
                    } else {
                        await StorageService.removeValue(AUTH_KEY_NAME);
                        if (Platform.OS === 'ios') {
                            await CookieManager.clearByName(AUTH_KEY_NAME);
                        }
                    }

                    if (newSession && newSession !== this.sessionCookie) {
                        this.sessionCookie = newSession;
                        await StorageService.setItem(SESSION_KEY_NAME, newSession);
                    }
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    clearCookies = async () => {
        return await CookieManager.clearAll();
    }
}

const CookieService = new CookieService();
export default CookieService