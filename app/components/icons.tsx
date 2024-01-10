"use client"
import React, { CSSProperties } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition, faFilm, faPlay, faTv, faRss, faExternalLink, faCalendarDays, faPenToSquare, faPhotoFilm, faFolderTree, faLink, faHistory, faDatabase, faBookBookmark, faArrowsRotate, faEllipsis, faCloudArrowDown, faSpinner, faEdit, faPause, faFilter, faDeleteLeft, faTrash, faPlus, faSearchLocation } from '@fortawesome/free-solid-svg-icons'
import Icon from '@ant-design/icons'

const FromFontAwesome = (faIcon: IconDefinition, options?: { fade?: boolean, }) => {
    return ({ style }: { style?: CSSProperties }) => (<Icon
        component={
            () => <FontAwesomeIcon icon={faIcon} style={{ width: "1em", height: "1em", ...style }} />
        }
    />)
}


export const IconFilmSolid = FromFontAwesome(faFilm)
export const IconTvSolid = FromFontAwesome(faTv)
export const IconRssSolid = FromFontAwesome(faRss)
export const IconCalendarDaysSolid = FromFontAwesome(faCalendarDays)
export const IconCustomSolid = FromFontAwesome(faPenToSquare)
export const IconMediaSolid = FromFontAwesome(faPhotoFilm)
export const IconFolderTreeSolid = FromFontAwesome(faFolderTree)
export const IconLink = FromFontAwesome(faLink)
export const IconHistory = FromFontAwesome(faHistory)
export const IconDatabase = FromFontAwesome(faDatabase)
export const IconExternalLink = FromFontAwesome(faExternalLink)
export const IconBookBookMark = FromFontAwesome(faBookBookmark)
export const IconRefresh = FromFontAwesome(faArrowsRotate)
export const IconEllipsisLoading = FromFontAwesome(faEllipsis, { fade: true })
export const IconDownloader = FromFontAwesome(faCloudArrowDown)
export const IconLoading = FromFontAwesome(faSpinner)
export const IconEdit = FromFontAwesome(faEdit)
export const IconPlay = FromFontAwesome(faPlay)
export const IconPause = FromFontAwesome(faPause)
export const IconFilter = FromFontAwesome(faFilter)
export const IconDelete = FromFontAwesome(faTrash)
export const IconAdd = FromFontAwesome(faPlus)
export const IconIndexer = FromFontAwesome(faSearchLocation)
export const IconMediaServer = FromFontAwesome(faPhotoFilm)