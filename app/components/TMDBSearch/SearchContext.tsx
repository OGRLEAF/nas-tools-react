import { MediaWork, SeriesKey } from '@/app/utils/api/types';
import { createContext, useState } from 'react';

export type SearchSeriesType = SeriesKey// = [MediaWorkType?, MediaWork['key']?, MediaWorkSeason['key']?, MediaWorkEpisode['key']?]


export interface SearchContextType {
    keyword: string,
    selected?: MediaWork,
    setKeyword: (keyword: string) => void,
    setSelected: (value: MediaWork) => void,
    series: SearchSeriesType,
    setSeries: (value: SearchSeriesType) => void
}

export const SearchContext = createContext<SearchContextType>({
    keyword: "",
    setKeyword: (keyword) => { },
    setSelected: (value) => { },
    series: new SeriesKey(),
    setSeries: (value: SearchSeriesType) => { }
});


export const useSearch = (initialSeries?:SeriesKey) => {
    const [keyword, setKeyword] = useState("");
    const [selected, setSelected] = useState<MediaWork>();
    const [series, setSeries] = useState<SearchSeriesType>(new SeriesKey(initialSeries))
    return [{
        keyword, setKeyword,
        selected, setSelected,
        series,
        setSeries,
    }]
}
export const SearchContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [search] = useSearch();
    return <SearchContext.Provider value={search}>
        {children}
    </SearchContext.Provider>
}