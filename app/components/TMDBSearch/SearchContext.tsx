import { MediaWork } from '@/app/utils/api/types';
import { createContext, useContext, useState } from 'react';

export const SearchContext = createContext<{
    keyword: string,
    selected?: MediaWork,
    setKeyword: (keyword: string) => void,
    setSelected: (value: MediaWork) => void,
    series: string[],
    setSeries: (value: string[]) => void
}>({
    keyword: "",
    setKeyword: (keyword) => { },
    setSelected: (value) => { },
    series: [],
    setSeries: (value: string[]) => { }
});



export const SearchContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [keyword, setKeyword] = useState("");
    const [selected, setSelected] = useState<MediaWork>();
    const [series, setSeries] = useState<string[]>([])
    const value = {
        keyword, setKeyword,
        selected, setSelected,
        series,
        setSeries: (series: string[]) => {
            const hasUndefined = (series as (string | undefined)[]).indexOf(undefined);
            if (hasUndefined > -1) {
                setSeries(series.slice(0, hasUndefined))
            } else {
                setSeries(series)
            }
        }
    }

    return <SearchContext.Provider value={value}>
        {children}
    </SearchContext.Provider>
}