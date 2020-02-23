import { Duration } from 'luxon';

let ROOT_PATH = ".";
if (process.env.NODE_ENV !== 'production') {
    ROOT_PATH = 'https://edwin0cheng.github.io/github-action-usage-test/';
}

export const PAGE_COMMITS_COUNT = 50;

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

const parseTime = function (s: string): number {
    if (s.endsWith("ms")) {
        return parseFloat(s.substring(0, s.length - 2))
    }
    return parseFloat(s.substring(0, s.length - 1)) * 1000
}

type HistoryCallback = (arg: CommitHistory | [number,number]) => void;

export class CommitHistory {
    commits: Array<CommitStat> = [];
    nCommits: number | null = null;
    cb: HistoryCallback | null = null;

    subscribe(cb: HistoryCallback) {
        this.cb = cb;
    }

    setCommitCount(n: number) {
        this.nCommits = n;
        this.commits = [];        
    }

    add(stat: CommitStat) {
        this.commits.push(stat);
        this.commits.sort((a, b) => {
            return b.timestamp - a.timestamp;
        });

        if(this.nCommits === null || this.cb === null) {
            return;
        }

        if (this.commits.length < this.nCommits) {            
            this.cb([this.commits.length, this.nCommits]);  
            return;
        }

        this.cb(this);
    }
}

export class CommitResult {
    constructor(readonly sha: string, readonly timestamp: number, private history: CommitHistory) {
    }

    async fetch(): Promise<CommitStat> {
        const res = await fetch(ROOT_PATH + '/data/' + this.sha + '.json')
        const json = await res.json()
        let stats = json.map((s: any) => {
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
        });

        let result = {
            timestamp: this.timestamp,
            commit_sha: this.sha,
            stats,
            totalExpressions: totalExpressions(stats),
            totalUnknown: totalUnknown(stats),
            totalPartial: totalPartial(stats),
            errorRate: errorRate(stats),
        };

        this.history.add(result);

        return result;
    }
}

function totalExpressions(stats: StatsOrError[]): number {
    let total_expressions = 0;
    for (let stat of stats) {
        if (stat.kind === "stats") {
            total_expressions += stat.expressions;
        }
    }
    return total_expressions;
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

let wholeHistory: CommitHistory = new CommitHistory();

export const fetchCommits = async function (start: number): Promise<[number, CommitResult[]]> {
    let commitsSource = ROOT_PATH + '/data/commits.json';

    const res = await fetch(commitsSource);
    const json = await res.json();
    const entries = Object.entries(json.commits);

    let shaList: Array<CommitResult> = entries.map(([key, value]) => {
        return new CommitResult(key, parseInt("" + value) as number, wholeHistory!);
    });
    shaList.sort((a, b) => {
        return b.timestamp - a.timestamp;
    });
    const totalCount = shaList.length;
    shaList = shaList.slice(start, start + PAGE_COMMITS_COUNT);
    wholeHistory.setCommitCount(shaList.length);
    

    // if (window.location.hash) {
    //     // Scroll to hash after 0.5 sec
    //     setTimeout(() => {
    //         console.log(window.location.hash)
    //         document!.getElementById(window.location.hash.substr(1))!.scrollIntoView();
    //     }, 0.5)
    // }
    return [totalCount, shaList];
}

export function subscribeHistory(cb : HistoryCallback ) {
    wholeHistory.subscribe(cb);
}
