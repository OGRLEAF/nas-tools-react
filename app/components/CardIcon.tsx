import Image from "next/image"
import React from "react"


export function CardIcon({ src, name, backgroundColor }: { src: string, name: string, backgroundColor?: React.CSSProperties['backgroundColor'] }) {
    return <div style={{
        height: 105, padding: 7.5,
        borderRadius: "8px 8px 0px 0px", width: "100%", backgroundColor: backgroundColor ?? "#3872C2",
    }}>
        <div style={{ borderRadius: 45, width: 90, height: 90, position: "relative", background: "none", overflow: "hidden" }}>
            <Image alt={name} fill sizes="90px" style={{ objectFit: "cover" }} src={src} />
        </div>
    </div>
}
const BASE_PATH = process.env.BASE_PATH

export const IMAGE_BASE_PATH = BASE_PATH