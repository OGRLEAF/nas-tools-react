import { MediaWork } from '@/app/utils/api/types';
import { createContext, useContext, useState } from 'react';

export const SearchContext = createContext<{
    keyword: string,
    selected?: MediaWork,
    setKeyword: (keyword: string) => void,
    setSelected: (value: MediaWork) => void
}>({
    keyword: "",
    setKeyword: (keyword) => { },
    setSelected: (value) => { }
});



export const SearchContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [keyword, setKeyword] = useState("");
    const [selected, setSelected] = useState<MediaWork>();
    const value = { keyword, setKeyword, selected, setSelected }

    return <SearchContext.Provider value={value}>
        {children}
    </SearchContext.Provider>
}