"use client"
import { Cards, CardsForm } from "@/app/components/CardsForm";
import { PluginRepo, PluginRepoResource } from "@/app/utils/api/plugin";
import React from "react";
import { Button } from "antd";
import { IconDownloader } from "@/app/components/icons";
import { useSubmitMessage } from "@/app/utils";
import { PluginIcon } from "../PluginIcon";


export default function PluginRepoPage() {
    const { bundle, contextHolder } = useSubmitMessage('安装')
    const installMessage = bundle('安装')
    return <CardsForm<PluginRepoResource>
        title="插件库"
        resource={PluginRepo}
    >{contextHolder}
        <Cards<PluginRepoResource>
            spaceProps={{ wrap: true, align: "start" }}
            cardProps={(record) => {
                return {
                    title: record.name,
                    description: record.desc,
                    cover: <PluginIcon src={`/static/img/plugins/${record.icon}`} />,
                    extra: record.installed ? undefined : (resource) => {
                        const { refresh } = resource.useList();
                        return <Button type="text" size="small" icon={<IconDownloader />}
                            onClick={(evt) => {
                                evt.stopPropagation();
                                installMessage.loading()
                                new PluginRepo().install(record.key)
                                    .then(() => installMessage.success())
                                    .catch((e) => installMessage.error(e))

                                    .finally(() => refresh())
                            }}
                        />
                    }
                }
            }}
        />
    </CardsForm>
}