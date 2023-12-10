import _ from "lodash";
import { APIBase } from "./api_base";
import { MediaIdentifyContext, MediaWorkType, SeriesKey } from "./types"

export type NameTestResultData = {
    type: MediaWorkType,
    category: string,
    customization: any,
    effect: any,
    ignored_words: any[],
    name: string,
    offset_words: string[],
    org_string: string,
    part: any,
    pix: string,
    replaced_words: string[],
    restype: any,
    rev_string: string,
    season_episode: string,
    team: string,
    title: string,
    tmdb_S_E_link: string,
    tmdbid: number,
    tmdblink: string,
    audio_codec: string,
    video_codec: string,
    year: string
}


export class MediaIdentify extends APIBase {
    constructor() {
        super();
    }

    public async identify(fileName: string): Promise<MediaIdentifyContext> {
        const nameTestResult = await (await this.API).nameTest(fileName);
        const season_episode = /S(?<season>\d+)[_\s]E(?<episode>\d+)/g.exec(nameTestResult.season_episode)
        return {
            tmdbId: String(nameTestResult.tmdbid),
            type: nameTestResult.type as unknown as MediaWorkType,
            ...(season_episode?.groups ? {
                season: Number(season_episode.groups['season']),
                episode: Number(season_episode.groups['episode'])
            } : {}),
            year: nameTestResult.year,
            title: nameTestResult.title
        }
    }

    public async identifySeries(fileName: string): Promise<SeriesKey> {
        const { data: result } = await (await this.API).post<{ data: NameTestResultData }>("service/name/test", { auth: true, data: { name: fileName } })
        const season_episode = /S(?<season>\d+)[_\s]E(?<episode>\d+)/g.exec(result.season_episode)
        const season = Number(season_episode?.groups?.['season'])
        const episode = Number(season_episode?.groups?.['episode'])
        return new SeriesKey()
            .type(result.type)
            .tmdbId(result.tmdbid)
            .season(_.isNaN(season) ? undefined : season)
            .episode(_.isNaN(episode) ? undefined : episode)
    }
}