import { MediaWorkType, SeriesKeyType } from "../types";

const UnsetKey = -1;

type UnsetKeyType = typeof UnsetKey;
type AnyKeyType = null;


type NumericKeyType = number | UnsetKeyType | AnyKeyType;


// export type MediaWorkType = MediaWorkType
export type TmdbIdType = string; // MediaWork['key']
export type SeasonKeyType = NumericKeyType
export type EpisodeKeyType = NumericKeyType

export type SeriesKeyTuple = [
  t: MediaWorkType, i?: TmdbIdType, s?: SeasonKeyType, e?: EpisodeKeyType]

// TODO: Better to seperate SeriesKey to multiple level: TypeKey -> TMDBKey -> SeasonKey -> EpisodeKey -> SeriesKey
export class SeriesKey {

  private typeKey: MediaWorkType = MediaWorkType.UNKNOWN;
  private tmdbIdKey?: string;//  MediaWork['key']
  private seasonKey: SeasonKeyType = -1;
  private episodeKey: EpisodeKeyType = -1;
  protected _end: SeriesKeyType = SeriesKeyType.NULL;

  constructor(keys?: SeriesKey) {
    if (keys) {
      this.episodeKey = keys.episodeKey;
      this.seasonKey = keys.seasonKey;
      this.tmdbIdKey = keys.tmdbIdKey;
      this.typeKey = keys.typeKey;
      this._end = keys._end;
    }

  }

  public type(type?: MediaWorkType) {
    if (type != undefined) {
      this.typeKey = type;
      this._end = SeriesKeyType.TYPE;
      if (this.typeKey == MediaWorkType.MOVIE) {
        this.seasonKey = -1;
        this.episodeKey = -1;
      }
    }

    return this
  }

  public tmdbId(tmdbId?: string) {
    if (this.typeKey != MediaWorkType.UNKNOWN && tmdbId != "") {
      this._end = SeriesKeyType.TMDBID;
      this.tmdbIdKey = tmdbId;
    }
    return this
  }

  public season(season?: SeasonKeyType) {
    if (this.t == MediaWorkType.MOVIE) return this;
    if (this.tmdbIdKey != undefined) {
      this.seasonKey = season ?? -1;
      if (this.seasonKey != -1)
        this._end = SeriesKeyType.SEASON
    }
    return this
  }


  public episode(episode?: EpisodeKeyType) {
    if (this.t == MediaWorkType.MOVIE) return this;
    if (this.seasonKey != undefined) {
      this.episodeKey = episode ?? -1;
      if (this.episodeKey != -1) {
        this._end = SeriesKeyType.EPISODE
      }
    }
    return this
  }

  public has(key: "tmdbId" | "episode" | "season") {
    switch (key) {
      case "tmdbId": return this.tmdbIdKey != undefined;
      case "episode": return this.episodeKey != undefined;
      case "season": return this.seasonKey != undefined;
    }
  }

  public compare(s?: SeriesKey): SeriesKey['_end'] {
    if (s == undefined) return SeriesKeyType.NULL
    let final = SeriesKeyType.EPISODE;
    final = (s.e == this.e) ? final : SeriesKeyType.SEASON;
    final = (s.s == this.s) ? final : SeriesKeyType.TMDBID;
    final = (s.i == this.i) ? final : SeriesKeyType.TYPE;
    final = (s.t == this.t) ? final : SeriesKeyType.NULL;
    return final
  }

  public get s() {
    if (this.end >= SeriesKeyType.SEASON) return this.seasonKey
    return -1
  }
  public get e() {
    if (this.end >= SeriesKeyType.EPISODE) return this.episodeKey
    return -1;
  }
  public get i() {
    if (this.end >= SeriesKeyType.TMDBID) return this.tmdbIdKey

  }
  public get t() {
    return this.typeKey
  }

  public get end() {
    return this._end
  }

  public dump(): SeriesKeyTuple {
    const keyPath: SeriesKeyTuple = [this.t, this.i, this.s, this.e];
    return keyPath;
    // return keyPath.filter(k => k != -1 && k != undefined)
  }

  public static load(keyPath: SeriesKeyTuple) {
    return new SeriesKey().type(keyPath[0])
      .tmdbId(keyPath[1])
      .season(keyPath[2])
      .episode(keyPath[3])
  }

  public childrenKey() {

  }

  public get(key: SeriesKeyType) {
    switch (key) {
      case SeriesKeyType.TYPE: return this.t;
      case SeriesKeyType.TMDBID: return this.i;
      case SeriesKeyType.SEASON: return this.s;
      case SeriesKeyType.EPISODE: return this.e;
    }
  }


  public slice(key: SeriesKeyType) {
    const s = new SeriesKey(this);
    if (s._end > key) {
      s._end = key;
    }

    return s
  }

  public stepUpper() {
    if (this._end >= SeriesKeyType.TMDBID) {
      return this.slice(this._end - 1)
    }
  }

}
