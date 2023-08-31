// import React, { useState, useEffect } from "react";
// import { TreeSelect, TreeSelectProps } from "antd"
// import { API, NastoolFileListItem } from "@/app/utils/api";

// export interface PathSelectorProps {
//     value?: string,
//     onChange: (value: string) => void
// }
// function PathSelector({ value: string = "/", onChange }: PathSelectorProps) {
//     const [loadingState, setLoadingState] = useState(true)
//     const [value, setValue] = useState<string>();
//     const [dirList, setDirList] = useState<NastoolFileListItem[]>([])
//     const pathManager = 
//     useEffect(() => {
//         setLoadingState(true);
//         const nastool = API.getNastoolInstance();
//         nastool.then(async (nastool) => {

//             const fileList = await nastool.getFileList(pathManagerContext.getBasePath, pathManagerContext.getDeepestRelativePath());
//             console.log("refresh: ", fileList, pathManagerContext.deepestPath)
//             setDirList(fileList.directories)
            
//             setLoadingState(false);
//         })

//         return () => { console.log("clean", nastool) }
//     }, [pathManagerContext]);

//     return <>
//         <TreeSelect

//         />
//     </>
// }
