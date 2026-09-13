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



// TODO: For migrating to beta
import { MediaWorkMetadata } from "./media/mediaWork"

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
import { SeriesKey as SeriesKeyBase } from "./media/SeriesKey"

export class SeriesKey extends SeriesKeyBase {
}


// TODO: For migrating to beta
import { MediaWork as MediaWorkBase } from "./media/mediaWork"
import extend from "lodash/extend";
import { extname } from "node:path";

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


export interface MediaFileProps {
  metadata: Record<string, any>
  fileName: string,
  path?: string,
  extention: string
}

export interface MediaVideoFileProps extends MediaFileProps {
  metadata: {
    vcodec?: any,
    acodec?: any,
    resolution?: [number, number],
    bitDepth: string,
    releaseGroup?: string,
  }
  rels: ExternalMediaFileProps[]
}

export interface ExternalMediaFileProps extends MediaFileProps {
  fileType: "caption" | "audio"
};

export interface MediaAudioFileProps extends ExternalMediaFileProps
{
  metadata: {
    acodec?: any
    sampleRate: number
  }
}

export interface MediaCaptionFileProps extends ExternalMediaFileProps {
  captionType: "ass" | "srt" | "opg",
  language: string,
  encoding: string
}

export interface UnkownMediaFileProps extends MediaFileProps {

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
