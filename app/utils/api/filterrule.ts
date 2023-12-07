import { APIBase } from "./api_base";


export interface FilterRuleConfig {
    id: number,
    group: number,
    name: string,
    pri: string,
    include: string[],
    exclude: string[],
    size: string,
    free: string,
    free_text: string
}

export interface FilterRuleGroupConfig {
    id: number,
    name: string,
    note?: string,
    rules: FilterRuleConfig[]
}

export class FilterRule extends APIBase {
    constructor() {
        super();
    }

    public async list():Promise<FilterRuleGroupConfig[]> {
        const result = await (await this.API).post<{ ruleGroups: FilterRuleGroupConfig[], initRules: [] }>("filterrule/list", { auth: true })
        return result.ruleGroups;
    }
}