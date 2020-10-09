//import React, { useEffect, useState, useRef } from 'react';
import CookieManager from '@react-native-community/react-native-cookies';
import StorageService from './LocalStorageService';

class CookieService {

    constructor() {
        this.manager = CookieManager
        this.store = StorageService
        this.authCookie = null;
        this.sessionCookie = null;

        this.AUTH_KEY = ".ASPXFORMSAUTH";
        this.SESSION_KEY = "ASP.NET_SessionId";
    }

    loadStoredCookies = async (url) => {
        return new Promise((resolve, reject) => {
            this.store.getMultipleValues([this.AUTH_KEY, this.SESSION_KEY])
                .then(async stored => {

                    let authPresent = false;

                    for (const cookie of stored) {
                        const cookieKey = cookie[0];
                        const parsed = JSON.parse(cookie[1]);

                        if (cookieKey === this.AUTH_KEY && parsed !== this.authCookie) {
                            this.authCookie = parsed;
                            authPresent = true;
                        }
                        if (cookieKey === this.SESSION_KEY && parsed !== this.sessionCookie) {
                            this.sessionCookie = parsed;
                        }
                        if (parsed) {
                            const headers = `${cookieKey}=${parsed}; path=/; expires=${new Date().setHours(new Date().getHours() + 1)}; secure; HttpOnly;`
                            await this.manager.setFromResponse(url, headers)
                        }
                    }
                    resolve(authPresent)
                }).catch(error => reject(error));
        });
    }

    updateCookies = async (url) => {
        return new Promise((resolve, reject) => {
            this.manager.get(url, true)
                .then(async (response) => {
                    const newAuth = response[this.AUTH_KEY];
                    const newSession = response[this.SESSION_KEY];

                    if (newAuth && newAuth !== this.authCookie) {
                        this.authCookie = newAuth;
                        await this.store.setValue(this.AUTH_KEY, newAuth);
                    }
                    if (newSession && newSession !== this.sessionCookie) {
                        this.sessionCookie = newSession;
                        await this.store.setValue(this.SESSION_KEY, newSession);
                    }
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    clearCookies = async () => {
        return await this.manager.clearAll();
    }
}

const cookieService = new CookieService();
export default cookieService