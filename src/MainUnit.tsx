import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { Container, Box, FormControl, RadioGroup, FormControlLabel, Radio } from '@material-ui/core';
import {CommitStat, Stats} from './commitStats';

const useStyles = makeStyles({
    root: {
        width: '100%',
        overflowX: 'auto',
    },
    paper: {
        paddingBottom: '100px',
    },
    table: {
        minWidth: 650,
    },
});

interface BenchmarksProps {
    commit: CommitStat,
    setTab: (tab: string) => void,
    tab: string,
}

function Benchmarks(props: BenchmarksProps) {
    const classes = makeStyles({
        tablecell: {
            // fontSize: '0.8em'
        },
        detail: {
            paddingLeft: '1em',
            paddingRight: '1em'
        }
    })()

    const shortName = function (str: string): string {
        var base = str.substring(0, str.length - 1)
        base = base.substring(base.lastIndexOf('/') + 1, str.length);

        return base;
    }

    const percent = function(n: number, base: number): string {
        if (base === 0) return "0%";

            const p = (n / base) * 100.0
            return `${p.toFixed(2)}%`
    }

    const row = function (stat: Stats) {
        const percent_expr = function (n: number): string {
            return percent(n, stat.expressions)
        }

        let content_rows = [];

        if (props.tab === "0") {
            content_rows.push(<TableCell className={classes.tablecell} align="right">{stat.declarations}</TableCell>);
            content_rows.push(<TableCell className={classes.tablecell} align="right">{stat.functions}</TableCell>);
            content_rows.push(<TableCell className={classes.tablecell} align="right">{stat.expressions}</TableCell>);
            content_rows.push(<TableCell className={classes.tablecell} align="right">{stat.unknown_types} ({percent_expr(stat.unknown_types)})</TableCell>);
            content_rows.push(<TableCell className={classes.tablecell} align="right">{stat.partial_unknown_types} ({percent_expr(stat.partial_unknown_types)})</TableCell>);
            content_rows.push(<TableCell className={classes.tablecell} align="right">{stat.type_mismatches}</TableCell>);
        } else {
            content_rows.push(<TableCell className={classes.tablecell} align="right">{Math.floor(stat.database_loaded_time.milliseconds)}</TableCell>);
            content_rows.push(<TableCell className={classes.tablecell} align="right">{Math.floor(stat.item_collection_time.milliseconds)}</TableCell>);
            content_rows.push(<TableCell className={classes.tablecell} align="right">{Math.floor(stat.inferenece_time.milliseconds)}</TableCell>);
            content_rows.push(<TableCell className={classes.tablecell} align="right">{Math.floor(stat.total_time.milliseconds)}</TableCell>);
        }

        return (<TableRow key={stat.project_name}>
            <TableCell className={classes.tablecell} component="th" scope="row">{shortName(stat.project_name)}</TableCell>
            <TableCell className={classes.tablecell} align="right">{stat.roots}</TableCell>
            <TableCell className={classes.tablecell} align="right">{stat.crates} [{stat.modules}]</TableCell>

            {content_rows}

        </TableRow>)
    }

    const rows = function () {
        let rows = [];
        for (let stat of props.commit.stats) {
            rows.push(row(stat))
        }
        return rows;
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        props.setTab(event.target.value);
    };

    let total_expresions = props.commit.totalExpressions
    let total_unknown = props.commit.totalPartial + props.commit.totalUnknown;

    let headers = []
    if (props.tab === "0") {
        headers.push(<TableCell className={classes.tablecell} align="right">Decl</TableCell>);
        headers.push(<TableCell className={classes.tablecell} align="right">Func</TableCell>);
        headers.push(<TableCell className={classes.tablecell} align="right">Expr</TableCell>);
        headers.push(<TableCell className={classes.tablecell} align="right">Unknown</TableCell>);
        headers.push(<TableCell className={classes.tablecell} align="right">Partial</TableCell>);
        headers.push(<TableCell className={classes.tablecell} align="right">Mismatches</TableCell>);
    } else {
        headers.push(<TableCell className={classes.tablecell} align="right">Database Loaded(ms)</TableCell>);
        headers.push(<TableCell className={classes.tablecell} align="right">Items(ms)</TableCell>);
        headers.push(<TableCell className={classes.tablecell} align="right">Inference(ms)</TableCell>);
        headers.push(<TableCell className={classes.tablecell} align="right">Total(ms)</TableCell>);
    }

    return (
        <Container>
            <Box display="flex" p={1}>
                <Box flexGrow={1}>
                    <p>Commit SHA: {props.commit.commit_sha}</p>
                    <Box display="flex">
                        <Box className={classes.detail}><small>Timestamp: {props.commit.timestamp}</small></Box>
                        <Box className={classes.detail}><small>Total Expression: {total_expresions}</small></Box> 
                        <Box className={classes.detail}><small>Total Unknown + Partial: {total_unknown} ({percent(total_unknown, total_expresions)})</small></Box> 
                    </Box>
                </Box>
                <Box>
                    <FormControl component="fieldset">
                        <RadioGroup aria-label="position" name="position" value={props.tab} onChange={handleChange} row>
                            <FormControlLabel
                                value="0"
                                control={<Radio color="primary" />}
                                label="Syntax"
                                labelPlacement="end"
                            />
                            <FormControlLabel
                                value="1"
                                control={<Radio color="primary" />}
                                label="Time(ms)"
                                labelPlacement="end"
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>
            </Box>

            <Table size="small" aria-label="Benchmarks table">
                <TableHead>
                    <TableRow>
                        <TableCell className={classes.tablecell}>Project Name</TableCell>
                        <TableCell className={classes.tablecell} align="right">Roots</TableCell>
                        <TableCell className={classes.tablecell} align="right">Crates [Modules]</TableCell>
                        {headers}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows()}
                </TableBody>
            </Table>
        </Container>

    )
}

interface MainUnitProps {
    commits: CommitStat[];
}

export default function MainUnit(props: MainUnitProps) {
    const classes = useStyles();
    const [value, setValue] = React.useState("0");

    const handleTabChange = (newValue: string): void => {
        setValue(newValue);
    };

    return (
        <div className={classes.root}>
            {props.commits.map((commit) =>
                <Paper className={classes.paper} key={commit.commit_sha}>
                    <Benchmarks commit={commit} setTab={handleTabChange} tab={value} />
                </Paper>
            )}
        </div>
    );
}