import { API, NASTOOL } from "./api";

export class APIBase {
    protected API:Promise<NASTOOL>
    protected static instance: APIBase;
    constructor() {
        this.API = API.getNastoolInstance();

    }
    
}