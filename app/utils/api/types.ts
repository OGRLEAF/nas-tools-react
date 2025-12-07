export enum SyncMode {
  COPY = "copy",
  LINK = "link",
  softlink = "softlink",
  move = "move",
  rclone = "rclone",
  rclonecopy = "rclonecopy",
  minio = "minio",
  miniocopy = "miniocopy"
}


export enum MediaWorkType {
  TV = "电视剧",
  MOVIE = "电影",
  ANI = "动漫",
  UNKNOWN = '未知',
}

export type MediaWorkTypeType = MediaWorkType.TV | MediaWorkType.MOVIE | MediaWorkType.ANI | MediaWorkType.UNKNOWN;

export interface MediaIdentifyContext {
  tmdbId: string,
  type: MediaWorkType,
  season?: number,
  episode?: number,
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


// TODO: For migrating to beta
import { MediaWorkMetadata } from "./media/media_work"

// export const MediaWorkMetadata =  MediaWorkMetadataBeta;
// export interface MediaWorkMetadata {
//   title: string,
//   description: string,
//   images?: {
//     cover: string,
//     poster?: string,
//     background?: string,
//   },
//   links?: {
//     tmdb?: string,
//     douban?: string
//   }
//   date?: {
//     release: string
//   }
// }

export enum SeriesKeyType {
  NULL = -1,
  TYPE = 0,
  TMDBID = 1,
  SEASON = 2,
  EPISODE = 3,
}


// TODO: For migrating to beta
import { SeriesKey  as SeriesKeyBase } from "./media/SeriesKey"

export class SeriesKey extends SeriesKeyBase {

  public equal(s: SeriesKey) {
    return this.compare(s) == SeriesKeyType.EPISODE
  }
  public uniqueKey() {
    return this.dump().join('-')
    // return `${this.typeKey}-${this.tmdbIdKey}-${this.seasonKey}-${this.episodeKey}`
  }
  public merge(s: SeriesKey) {
    return new SeriesKey(this).type(s.t ?? this.t).tmdbId(s.i ?? this.i).season(s.s ?? this.s).episode(s.e ?? this.e)
  }
  public slice(key: SeriesKeyType) {
    const s = new SeriesKey(this);
    if (s._end > key) {
      s._end = key;
    }

    return s
  }
}


// TODO: For migrating to beta
import { MediaWork as MediaWorkBase } from "./media/media_work"

export interface MediaWork extends MediaWorkBase {
  series: SeriesKey,
  type: MediaWorkType,
  key: number | string,
  title: string
  metadata?: MediaWorkMetadata,
  children?: MediaWork[]
}

export interface MediaWorkSeason extends MediaWork {
  type: MediaWorkType.TV | MediaWorkType.ANI,
  key: number,
  children?: MediaWorkEpisode[]
}

export interface MediaWorkEpisode extends MediaWork {
  type: MediaWorkType.TV | MediaWorkType.ANI,
  key: number,
}

export interface Media {

}

export interface MediaFile {
  key: string,
  path: string,
  metadata: {
    vcodec?: any,
    acodec?: any,
    resolution?: [number, number],
    bitDepth: string,
    releaseGroup?: string,
  }
  rels: MediaExternalFile[]
}

export interface MediaExternalFile extends MediaFile {

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
