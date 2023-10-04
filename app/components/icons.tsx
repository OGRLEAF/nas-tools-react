import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition, faFilm, faTv, faRss, faExternalLink, faCalendarDays, faPenToSquare, faPhotoFilm, faFolderTree, faLink, faHistory, faDatabase, faBookBookmark, faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import Icon from '@ant-design/icons'

const FromFontAwesome = (faIcon: IconDefinition) => <Icon

    component={() => <FontAwesomeIcon
        style={{ width: "1em", height: "1em" }}
        icon={faIcon} />} />

export const IconFilmSolid = () => FromFontAwesome(faFilm)
export const IconTvSolid = () => FromFontAwesome(faTv)
export const IconRssSolid = () => FromFontAwesome(faRss)
export const IconCalendarDaysSolid = () => FromFontAwesome(faCalendarDays)
export const IconCustomSolid = () => FromFontAwesome(faPenToSquare)
export const IconMediaSolid = () => FromFontAwesome(faPhotoFilm)
export const IconFolderTreeSolid = () => FromFontAwesome(faFolderTree)
export const IconLink = () => FromFontAwesome(faLink)
export const IconHistory = () => FromFontAwesome(faHistory)
export const IconDatabase = () => FromFontAwesome(faDatabase)
export const IconExternalLink = () => FromFontAwesome(faExternalLink)
export const IconBookBookMark = () => FromFontAwesome(faBookBookmark)
export const IconRefresh = () => FromFontAwesome(faArrowsRotate)