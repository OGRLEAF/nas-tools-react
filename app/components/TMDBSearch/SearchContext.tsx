import { MediaWork, SeriesKey } from '@/app/utils/api/types';
import { createContext, useState } from 'react';

export type SearchSeriesType = SeriesKey// = [MediaWorkType?, MediaWork['key']?, MediaWorkSeason['key']?, MediaWorkEpisode['key']?]

export const SearchContext = createContext<{
    keyword: string,
    selected?: MediaWork,
    setKeyword: (keyword: string) => void,
    setSelected: (value: MediaWork) => void,
    series: SearchSeriesType,
    setSeries: (value: SearchSeriesType) => void
}>({
    keyword: "",
    setKeyword: (keyword) => { },
    setSelected: (value) => { },
    series: new SeriesKey(),
    setSeries: (value: SearchSeriesType) => { }
});



export const SearchContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [keyword, setKeyword] = useState("");
    const [selected, setSelected] = useState<MediaWork>();
    const [series, setSeries] = useState<SearchSeriesType>(new SeriesKey())
    const value = {
        keyword, setKeyword,
        selected, setSelected,
        series,
        setSeries,
    }

    return <SearchContext.Provider value={value}>
        {children}
    </SearchContext.Provider>
}