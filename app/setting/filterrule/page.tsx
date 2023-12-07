"use client"
import CardnForm from "@/app/components/CardnForm";
import { FilterRule, FilterRuleGroupConfig, FilterRuleConfig } from "@/app/utils/api/filterrule";
import { Card, Space } from "antd";
import React from "react";

const FilterRuleCard = ({ config }: { config: FilterRuleConfig }) => {
    return <Card
        size="small"
        title={config.name}
    >
        <Space size="small" direction="vertical">
            <span>包含：{config.include}</span>
            <span>排除：{config.exclude}</span>
        </Space>
    </Card>
}

const FilterRuleAddCard = () => {
    return <Card
        size="small"
        style={{height: "100%"}}
    >
        123
    </Card>
}

export default function FilterRulePage() {
    return <CardnForm
        title="过滤规则"
        onFetch={() => new FilterRule().list()}
        cardsLayout="tabs"
        cardProps={(record) => {
            const ruleCards = record.rules.map((config, index) => <FilterRuleCard key={index} config={config} />)
            return ({
                title: record.name,
                description: <Space wrap size="small" style={{alignItems: "stretch"}}>
                    {ruleCards}
                    <FilterRuleAddCard key={'n'} />
                </Space>
            });
        }}
        onDelete={async (record) => { console.log(record); return false }}
        formRender={function ({ record }: { record?: FilterRuleGroupConfig | undefined; }): React.JSX.Element {
            return <></>
        }}
    />
}