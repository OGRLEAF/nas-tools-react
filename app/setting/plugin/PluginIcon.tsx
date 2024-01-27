import React from "react"

export function PluginIcon({ src }: { src: string }) {
    return <div style={{
        height: 105, padding: 7.5,
        borderRadius: "8px 8px 0px 0px", width: "100%", backgroundColor: "#3872C2",
    }}>
        <img style={{ borderRadius: 45, width: 90, height: 90, objectFit: "cover" }} src={src} />
    </div>
}