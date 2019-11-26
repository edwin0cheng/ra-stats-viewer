import { Duration } from 'luxon';

export interface CommitStat {
    timestamp: number,
    commit_sha: string,
    stats: StatsOrError[],

    totalExpressions: number,
    totalUnknown: number,
    totalPartial: number,
    errorRate: number,
}

export interface Error {
    kind: "error",
    project_name: string,
    msg: string,
}

export interface Stats {
    kind: "stats",
    database_loaded_time: Duration,
    declarations: number,
    expressions: number,
    functions: number,
    inferenece_time: Duration,
    item_collection_time: Duration,
    crates: number,
    modules: number,
    partial_unknown_types: number,
    project_name: string,
    roots: number,
    total_time: Duration,
    type_mismatches: number,
    unknown_types: number,
}

export type StatsOrError = Stats | Error;

function totalExpressions(stats: StatsOrError[]): number {
    let total_expresions = 0;
    for (let stat of stats) {
        if (stat.kind === "stats") {
            total_expresions += stat.expressions;
        }
    }
    return total_expresions;
}

function totalUnknown(stats: StatsOrError[]): number {
    let total_unknown = 0;
    for (let stat of stats) {
        if (stat.kind === "stats") {
            total_unknown += stat.unknown_types;
        }
    }
    return total_unknown;
}

function totalPartial(stats: StatsOrError[]): number {
    let total_partial = 0;
    for (let stat of stats) {
        if (stat.kind === "stats") {
            total_partial += stat.partial_unknown_types;
        }
    }
    return total_partial;
}

function errorRate(stats: StatsOrError[]): number {
    let exprs = totalExpressions(stats)
    let totalError = totalUnknown(stats) + totalPartial(stats)
    if (totalError === 0) return 0;

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

    const fetchStats = async function (sha: string): Promise<StatsOrError[]> {
        const res = await fetch('./data/' + sha + '.json')
        const json = await res.json()
        return json.map((s: any) => {
            if (s.error) {
                s.kind = "error";
                s.msg = s.error;
            } else {
                s.kind = "stats";
                s.database_loaded_time = Duration.fromMillis(parseTime(s.database_loaded_time))
                s.inferenece_time = Duration.fromMillis(parseTime(s.inferenece_time))
                s.item_collection_time = Duration.fromMillis(parseTime(s.item_collection_time))
                s.total_time = Duration.fromMillis(parseTime(s.total_time))
            }

            return s
        })
    }

    let promises = [];
    let shaList: Array<[string, string]> = [];

    for (let [key, value] of Object.entries(json.commits)) {
        promises.push(fetchStats(key));
        shaList.push([key, value as string]);
    }

    let allStats = await Promise.all(promises);
    for (let i = 0; i < shaList.length; i++) {
        const [key, value] = shaList[i];
        const stats = allStats[i];

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

    if (window.location.hash) {
        // Scroll to hash after 0.5 sec
        setTimeout(() => {
            console.log(window.location.hash)
            document!.getElementById(window.location.hash.substr(1))!.scrollIntoView();
        }, 0.5)
    }
    // Sort by timestamp    
    return commits.sort((a, b) => {
        return b.timestamp - a.timestamp
    })
}