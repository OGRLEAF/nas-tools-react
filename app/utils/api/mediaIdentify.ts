import { APIBase } from "./api_base";
import { MediaIdentifyContext, MediaWorkType } from "./types"

export class MediaIdentify extends APIBase {
    constructor() {
        super();
    }
    
    public async identify(fileName: string):Promise<MediaIdentifyContext> {
        const nameTestResult = await (await this.API).nameTest(fileName);
        const season_episode = /S(?<season>\d+)[_\s]E(?<episode>\d+)/g.exec(nameTestResult.season_episode)
        return {
            tmdbId: String(nameTestResult.tmdbid),
            type: nameTestResult.type as unknown as MediaWorkType,
            ...(season_episode?.groups?{
                season: Number(season_episode.groups['season']),
                episode: Number(season_episode.groups['episode'])
            }:{}),
            year: nameTestResult.year,
            title: nameTestResult.title
        }
    }
}