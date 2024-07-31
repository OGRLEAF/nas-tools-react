import { createContext } from "react";
import { TMDBMediaWork } from "../utils/api/media/media_work";
import { SeriesKey } from "../utils/api/media/SeriesKey";

export const MediaWorkContext = createContext<TMDBMediaWork>(new TMDBMediaWork(new SeriesKey()))

