"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Section } from "@/app/components/Section"
import { API, NastoolServerConfig } from '@/app/utils/api/api'
import SettingSystem from './system'
import SettingMedia from "./media"
import SettingService from "./service"
import SettingSecurity from "./security"
import SettingLaboratory from "./laboratory"

import SettingCard from "./SettingCard"

import { Space } from 'antd'
import { useAPIContext } from '@/app/utils/api/api_base'
import VersionTag from '@/app/components/VersionTag'

export default function SettingBasic() {
    const [serverConfig, setServerConfig] = useState<NastoolServerConfig>()
    const { API: nastool } = useAPIContext();
    const onRefresh = useCallback(() => {
        if (nastool.loginState) {
            nastool.getServerConfig()
                .then((config) => {
                    setServerConfig(config)
                })
        }
    }, [nastool])
    useEffect(() => {
        onRefresh()
    }, [onRefresh])
    return <>
        <Section title="基础设置" onRefresh={onRefresh}>
            <Space direction="vertical" style={{ width: "100%" }}>
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