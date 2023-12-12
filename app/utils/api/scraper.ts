import { APIBase } from "./api_base";

export type ScraperConfigKey = {
    scraper_nfo: {
        movie: "basic" | "credits" | "credits_chinese",
        tv: "basic" | "credits" | "credits_chinese" | "episode_basic" | "episode_credits" | "season_basic",
    },
    scraper_pic: {
        movie: "backdrop" | "background" | "banner" | "disc" | "logo" | "poster" | "thumb",
        tv: "backdrop" | "background" | "banner" | "clearart" | "episode_thumb" | "episode_thumb_ffmpeg" | "logo" | "poster" | "thumb" |
        "season_banner" | "season_poster" | "season_thumb" | "thumb",
    }
}

type ScraperConfigEntry<T extends string | number | symbol> = Record<T, boolean>

export interface ScraperConfig {
    scraper_nfo: {
        movie: ScraperConfigKey['scraper_nfo']['movie'][],
        tv: ScraperConfigKey['scraper_nfo']['tv'][]
    },
    scraper_pic: {
        movie: ScraperConfigKey['scraper_pic']['movie'][],
        tv: ScraperConfigKey['scraper_pic']['tv'][]
    }
}



export const nfoAvaliableTypeMovie:ScraperConfigKey['scraper_nfo']['movie'][] = [ "basic" , "credits" , "credits_chinese"]
export const nfoAvaliableTypeTv:ScraperConfigKey['scraper_nfo']['tv'][] = ["basic" , "credits" , "credits_chinese" , "episode_basic" , "episode_credits" , "season_basic",]
export const picAvaliableTypeMovie:ScraperConfigKey['scraper_pic']['movie'][] = [ "backdrop" , "background" , "banner" , "disc" , "logo" , "poster" , "thumb",]
export const picAvaliableTypeTv:ScraperConfigKey['scraper_pic']['tv'][] = ["backdrop" , "background" , "banner" , "clearart" , "episode_thumb" , "episode_thumb_ffmpeg" , "logo" , "poster" , "thumb" ,
"season_banner" , "season_poster" , "season_thumb" ]


export class Scraper extends APIBase {
    public config = {
        get: async (): Promise<ScraperConfig> => {
            const { data } = await (await this.API).get<{ data: ScraperConfig }>("scraper/config", { auth: true });
            return data
        },

        update: async (data: ScraperConfig) => {
            return await (await this.API).post("scraper/config", {
                data: {
                    value: data
                },
                auth: true,
                json: true
            })
        }
    }
}
