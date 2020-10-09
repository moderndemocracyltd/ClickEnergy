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

    getAuthCookie = async () => {
        return this.authCookie
    }

    loadStoredCookies = async () => {
        return new Promise((resolve, reject) => {
            this.store.getMultipleValues([this.AUTH_KEY, this.SESSION_KEY])
                .then(async stored => {

                    let authPresent = false;

                    for (const cookie of stored) {

                        const cookieKey = cookie[0];
                        const parsed = JSON.parse(cookie[1]);

                        console.log("Parsed", parsed);

                        if (cookieKey === this.AUTH_KEY && parsed !== this.authCookie) {
                            this.authCookie = parsed;
                            authPresent = true;
                            console.log("auth updated", this.authCookie);
                        }

                        if (cookieKey === this.SESSION_KEY && parsed !== this.sessionCookie) {
                            this.sessionCookie = parsed;
                            console.log("session updated", this.sessionCookie);
                        }

                        if (parsed) {
                            const newcookie = {
                                name: cookieKey,
                                value: parsed,
                                domain: '',
                                path: '/',
                                version: '1',
                                origin: '',
                                expiration: new Date().setHours(new Date().getHours() + 1)
                            }
                            console.log("cookie", newcookie);
                            await this.manager.set(newcookie);
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
                    console.log(url);
                    const newAuth = response[this.AUTH_KEY];
                    const newSession = response[this.SESSION_KEY];

                    console.log("newAuth", newAuth);
                    console.log("newSession", newSession)

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