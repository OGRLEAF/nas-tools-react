import { APIArrayResourceBase, APIBase, ResourceType } from "../api_base"
import { MediaWorkMetadata, } from "../types"
import { SeriesKeyTuple } from "./SeriesKey"


export interface MediaWork {
  series: SeriesKeyTuple,
  metadata: MediaWorkMetadata
}

