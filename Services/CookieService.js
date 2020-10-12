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

    loadStoredCookies = async url => {
        try {
            let authPresent = false;
            let promises = [];
            const storedCookies = await this.store.getMultipleValues([this.AUTH_KEY, this.SESSION_KEY]);

            for (const cookie of storedCookies) {
                const [cookieKey, cookieValue] = cookie;

                if (cookieKey === this.AUTH_KEY && cookieValue !== this.authCookie) {
                    authPresent = true;
                    this.authCookie = cookieValue;
                }
                if (cookieKey === this.SESSION_KEY && cookieValue !== this.sessionCookie) {
                    this.sessionCookie = cookieValue;
                }
                if (cookieValue) {
                    const headers = `${cookieKey}=${cookieValue}; path=/; expires=${new Date().setHours(new Date().getHours() + 1)}; secure; HttpOnly;`
                    promises.push(this.manager.setFromResponse(url, headers));
                }
            }

            await Promise.all(promises);
            return authPresent;
        } catch (error) {
            console.error("Error loading cookies from storage:", error);
        }
    }

    saveCookies = async url => {
        try {
            const response = await this.manager.get(url, true);
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
        }
        catch (error) {
            console.error("Error saving cookies:", error);
        }
    }

    clearCookies = async () => {
        try {
            await this.manager.clearAll();
        }
        catch (error) {
            console.error("Error clearing cookies:", error);
        }
    }
}

const cookieService = new CookieService();
export default cookieService