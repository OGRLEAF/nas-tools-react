"use client"
import { Section } from "@/app/components/Section";
import { TagCheckboxGroup, TagCheckboxGroupProps } from "@/app/components/TagCheckbox";
import { useResource } from "@/app/utils/api/api_base";
import { IndexerEnabledSites, IndexerSite, Indexers } from "@/app/utils/api/indexer";
import { Button, Space } from "antd";
import _, { update } from "lodash";
import React, { useEffect, useMemo, useState } from "react";

export default function IndexersSetting() {
    return <Section title="索引器">
        <Section title="站点设置">
            <BuiltinIndexerSetting />
        </Section>
    </Section>
}

function BuiltinIndexerSetting() {
    const { useList } = new Indexers().useResource()
    const { list: sites } = useList();
    const { data: enabledSites, setData: setEnabledSites, update, messageContext } = new IndexerEnabledSites().useResource({ useMessage: true });
    return <Space direction="vertical">
        {messageContext}
        {sites ? <IndexerSitesSelector options={sites} value={enabledSites ?? []}
            onChange={((value) => { setEnabledSites(value) })} /> : <></>}
        <br />
        <Button type="primary" onClick={() => { update() }}>保存</Button>
    </Space>
}

function IndexerSitesSelector({ options: list, value, onChange }: { options: IndexerSite[], value: IndexerSite['id'][], onChange?: (value: IndexerSite['id'][]) => void }) {
    const checkboxPublicOptions: TagCheckboxGroupProps['options'] = list.filter(site => site.public).map((site) => {
        return {
            value: site.id,
            label: site.name,
        }
    })
    const checkboxPrivateOptions: TagCheckboxGroupProps['options'] = list.filter(site => !site.public).map((site) => {
        return {
            value: site.id,
            label: site.name,
        }
    })

    const [checkedSites, setCheckedSites] = useState(value)
    // useEffect(() => setCheckedSites(list.filter(site => site.enabled).map(site => site.id)), [list]);
    return <Space direction="vertical">
        <Section title="私有站点">
            <TagCheckboxGroup
                onChange={(value) => {
                    if (!_.isEqual(value, checkedSites)) {
                        setCheckedSites(value as string[])
                        onChange?.(value as string[]);
                    }
                }}
                value={checkedSites}
                options={checkboxPrivateOptions}
            />
        </Section>
        <Section title="公开站点">
            <TagCheckboxGroup
                onChange={(value) => {
                    if (!_.isEqual(value, checkedSites)) {
                        setCheckedSites(value as string[])
                        onChange?.(value as string[]);
                    }
                }}
                value={checkedSites}
                options={checkboxPublicOptions}
            />
        </Section>
    </Space>
}