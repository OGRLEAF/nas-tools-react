import { API, NASTOOL } from "./api";

export class APIBase {
    protected API:Promise<NASTOOL>
    constructor() {
        this.API = API.getNastoolInstance();
    }
    
}