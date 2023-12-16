import { APIBase } from "./api_base";

export interface FilterRuleConfig {
    id?: number,
    group: number,
    name: string,
    pri: string,
    include: string[],
    exclude: string[],
    size: string,
    free: string,
}

export interface FilterRuleGroupConfig {
    id: number,
    name: string,
    note?: string,
    default: boolean,
    rules: FilterRuleConfig[]
}

export class FilterRule extends APIBase {
    constructor() {
        super();
    }

    public async list(): Promise<FilterRuleGroupConfig[]> {
        const result = await (await this.API).post<{ ruleGroups: FilterRuleGroupConfig[], initRules: [] }>("filterrule/list", { auth: true })
        return result.ruleGroups;
    }

    public async add(options: { name: string, default: boolean }) {
        return await (await this.API).post("filterrule/group/add", {
            data: {
                name: options.name,
                'default': options.default
            },
            auth: true,
            json: true
        })
    }

    public async setDfault(id: FilterRuleGroupConfig['id']) {
        return await (await this.API).post("filterrule/group/default", { data: { id }, auth: true, })
    }



    public async delete(id: FilterRuleGroupConfig['id']) {
        return await (await this.API).post("filterrule/group/delete", {
            data: {
                id: id
            },
            auth: true
        })
    }

    public rule = {
        update: async (config: FilterRuleConfig) => {
            const result = await (await this.API).post("filterrule/rule/update", {
                data: {
                    ...config
                },
                auth: true,
                json: true,
            })
            return result
        },
        delete: async (id: FilterRuleConfig['id']) => {
            return await (await this.API).post("filterrule/rule/delete", { data: { id: id }, auth: true })
        }
    }
}