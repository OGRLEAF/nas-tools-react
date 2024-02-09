import { Card } from "antd";
import React, { use, useEffect, useState } from "react";

const NEXT_PUBLIC_PACKAGE_VERSION = process.env.NEXT_PUBLIC_PACKAGE_VERSION;
const NEXT_PUBLIC_BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME
const NEXT_PUBLIC_API_HOST = process.env.NEXT_PUBLIC_API_HOST

const getServerVersion = async () => {
    const result = await fetch(`/api/v1/system/version`, { cache: 'force-cache' });
    return result.json()
}

export default function VersionTag() {
    const [version, setVersion] = useState<string>()
    useEffect(() => {
        getServerVersion().then((value) => setVersion(value.data.version))
        .catch(()=>setVersion("<Error>"))
    }, [])
    return <Card>
        <div>Web Page: v{NEXT_PUBLIC_PACKAGE_VERSION} build at {NEXT_PUBLIC_BUILD_TIME}</div>
        <div>Server: {version}</div>
    </Card>
}