"use client"
export default class ClientStorage<T> {
    private prefix: string;
    constructor(name: string) {
        this.prefix = name;
    }

    public setItem(key: string, data: T) {
        const storageKey = `${this.prefix}/${key}`
        const dataJson = JSON.stringify(data);
        return window.localStorage.setItem(storageKey, dataJson)
    }

    public getItem(key: string): T | undefined {
        const storageKey = `${this.prefix}/${key}`
        if (typeof window !== 'undefined') {
            const dataJson = window.localStorage.getItem(storageKey)
            if (dataJson == null) {
                return undefined;
            } else {
                const data = JSON.parse(dataJson) as T;
                return data;
            }
        }
    }
}