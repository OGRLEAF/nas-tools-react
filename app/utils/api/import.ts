import { ImportMode, NastoolMediaType } from "./api";
import { APIBase } from "./api_base";
import { MediaWorkSeason } from "./types";

export class Organize extends APIBase {
    constructor() {
        super();
    }
    public async importTV(path: string,
        files: string[],
        importMode: ImportMode,
        season: MediaWorkSeason,
        dryrun = true): Promise<void> {
        console.log(importMode)
        const request = await (await this.API).mediaFileImport(path, files, importMode, season.key, season.series[0], NastoolMediaType.TV)
        console.log(request)
    }

    public async getLibrariesPath() {
        const config = (await this.API).getServerConfig();
        return (await config).media
    }
}