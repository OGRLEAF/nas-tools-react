export enum MediaWorkType {
  TV = "电视剧",
  MOVIE = "电影",
  ANI = "动漫",
  UNKNOWN = '未知',
}


export interface MediaIdentifyContext {
  tmdbId: string,
  type: MediaWorkType,
  season?: number,
  episode?: number | string,
  year?: string,
  title: string,
}


type Arrayify<T> = {
  [K in keyof T]: Set<T[K]>;
};

export type MediaIdentifyMerged = Arrayify<MediaIdentifyContext>;


export interface MediaFile {
  path: string,
  type: "Video",

}

export interface MediaWorkMetadata {
  title: string,
  description: string,
  image: {
    cover: string,
    background?: string,
  },
  links: {
    tmdb?: string,
    douban?: string
  }
  date: {
    release: string
  }
}

export interface MediaWork {
  series: string[],
  type: MediaWorkType, // "season" | "episode" | "series" | "movie"
  key: number | string,
  title: string
  metadata?: MediaWorkMetadata,
  children?: MediaWork[]
}

export interface MediaWorkSeason extends MediaWork {
  series: [string],
  type: MediaWorkType.TV | MediaWorkType.ANI,
  key: number,
  children?: MediaWorkEpisode[]
}

export interface MediaWorkEpisode extends MediaWork {
  series: [string, string],
  type: MediaWorkType.TV | MediaWorkType.ANI,
  key: number,
}

export interface Media {

}

export function mergeObjects(...objects: any[]): any {
  const result: any = {};
  objects.forEach((obj) => {
    for (const key in obj) {
      if (obj[key] !== undefined) {
        if (!result[key]) {
          result[key] = new Set();
        }
        result[key].add(obj[key]);
      }
    }
  });

  return result;
}
