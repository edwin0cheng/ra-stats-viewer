import { Duration } from 'luxon';

export interface CommitStat {
    timestamp: number,
    commit_sha: string,
    stats: Stats[],
    
    totalExpressions: number,
    totalUnknown : number,
    totalPartial: number,
    errorRate: number,
}

type FloatWithUnit = Duration;

export interface Stats {
    database_loaded_time: FloatWithUnit,
    declarations: number,
    expressions: number,
    functions: number,
    inferenece_time: FloatWithUnit,
    item_collection_time: FloatWithUnit,
    crates: number,
    modules: number,
    partial_unknown_types: number,
    project_name: string,
    roots: number,
    total_time: FloatWithUnit,
    type_mismatches: number,
    unknown_types: number
}

function totalExpressions(stats: Stats[]) : number {
    let total_expresions = 0;
    for(let stat of stats ) {
        total_expresions += stat.expressions;
    }
    return total_expresions;
}

function totalUnknown(stats: Stats[]) : number {
    let total_unknown = 0;
    for(let stat of stats ) {
        total_unknown += stat.unknown_types;
    }
    return total_unknown;
}

function totalPartial(stats: Stats[]) : number {
    let total_partial = 0;
    for(let stat of stats ) {
        total_partial += stat.partial_unknown_types;
    }
    return total_partial;
}

function errorRate(stats: Stats[]) : number {
    let exprs = totalExpressions(stats)
    let totalError = totalUnknown(stats) + totalPartial(stats)
    if(totalError === 0) return 0;
    
    return (totalError / exprs) * 100.0
}


export const fetchCommits = async function (): Promise<CommitStat[]> {
    const res = await fetch('./data/commits.json')
    const json = await res.json()
    let commits: CommitStat[] = [];

    const parseTime = function (s: string): number {
        if (s.endsWith("ms")) {
            return parseFloat(s.substring(0, s.length - 2))
        }

        return parseFloat(s.substring(0, s.length - 1)) * 1000
    }

    const fetchStats = async function (sha: string): Promise<Stats[]> {
        const res = await fetch('./data/' + sha + '.json')
        const json = await res.json()
        return json.map((s: any) => {
            s.database_loaded_time = Duration.fromMillis(parseTime(s.database_loaded_time))
            s.inferenece_time = Duration.fromMillis(parseTime(s.inferenece_time))
            s.item_collection_time = Duration.fromMillis(parseTime(s.item_collection_time))
            s.total_time = Duration.fromMillis(parseTime(s.total_time))
            return s
        })
    }

    for (let [key, value] of Object.entries(json.commits)) {
        let stats = await fetchStats(key);
        
        commits.push({
            timestamp: parseInt("" + value) as number,
            commit_sha: key,
            stats,
            totalExpressions: totalExpressions(stats),
            totalUnknown: totalUnknown(stats),
            totalPartial: totalPartial(stats),
            errorRate: errorRate(stats),
        })
    }

    // Sort by timestamp    
    return commits.sort((a,b) => {
        return b.timestamp - a.timestamp
    })
}