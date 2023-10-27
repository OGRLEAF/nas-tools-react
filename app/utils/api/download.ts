import { APIBase } from "./api_base";

/**
 *  "result": [
 *       {
        "id": "492a34005f10860a14a2c64406dc0e7b75440d98",
        "name": "Shoujo Kakumei Utena 1997[少女革命][BD 1440x1080 AVC FLAC] - mawen1250",
        "speed": "已暂停",
        "state": "Stoped",
        "progress": 0,
        "title": "少女革命 (1997) S01",
        "image": "https://image.tmdb.org/t/p/w500/pOjDuclpsWGV13Nj7XtZukuZj6f.jpg"
      }
 */
export interface DownloadTask {
    id: string,
    name: string,
    speed: string,
    state: "Stoped" | "Downloading",
    progress: number,
}
export class Download extends APIBase {
    constructor() {
        super();
    }
}
