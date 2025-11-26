"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Section } from "@/app/components/Section"
import SettingSystem from './system'
import SettingMedia from "./media"
import SettingService from "./service"
import SettingSecurity from "./security"
import SettingLaboratory from "./laboratory"
import SettingCard from "./SettingCard"

import { Space } from 'antd'
import { useAPIContext, useDataResource } from '@/app/utils/api/api_base'
import VersionTag from '@/app/components/VersionTag'
import { ServerConfig } from '@/app/utils/api/serverConfig'

export default function SettingBasic() {
    const { useData } = useDataResource(ServerConfig)
    const { data: serverConfig, refresh, } = useData();
    // const [serverConfig, setServerConfig] = useState<NastoolServerConfig>()
    // const { API: nastool } = useAPIContext();
    // const onRefresh = useCallback(() => {
    //     if (nastool.loginState) {
    //         nastool.getServerConfig()
    //             .then((config) => {
    //                 setServerConfig(config)
    //             })
    //     }
    // }, [nastool])
    // useEffect(() => {
    //     onRefresh()
    // }, [onRefresh])
    return <>
        <Section title="基础设置" onRefresh={refresh}>
            <Space orientation="vertical" style={{ width: "100%", marginBottom: "10px" }}>
                <SettingCard name="系统" settingForm={SettingSystem} config={serverConfig} />
                <SettingCard name="媒体" settingForm={SettingMedia} config={serverConfig} />
                <SettingCard name="服务" settingForm={SettingService} config={serverConfig} />
                <SettingCard name="安全" settingForm={SettingSecurity} config={serverConfig} />
                <SettingCard name="实验室" settingForm={SettingLaboratory} config={serverConfig} />
                <VersionTag />
            </Space>
        </Section>
    </>
}