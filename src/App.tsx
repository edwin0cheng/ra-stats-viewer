import React, { useState, useEffect } from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Pagination from '@material-ui/lab/Pagination';
import Chart from './Chart';
import { makeStyles } from '@material-ui/core/styles';
import { Paper } from '@material-ui/core';
import MainUnit from './MainUnit';
import { CommitResult, CommitHistory, fetchCommits, subscribeHistory, PAGE_COMMITS_COUNT } from './commitStats';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
    },
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
    paper: {
        height: '320px',
    }
}))

interface GraphProps {
    commits: Array<CommitResult>
}

function Graph(props: GraphProps) {
    const classes = useStyles();

    const [history, setHistory] = useState(
        [0, 0] as CommitHistory | [number, number],
    );

    useEffect(() => {
        subscribeHistory((h: [number, number] | CommitHistory) => setHistory(h));
    }, [props.commits]);

    if (history instanceof CommitHistory) {
        return (<Paper className={classes.paper}>
            <Chart history={history as CommitHistory} />
        </Paper>);
    } else {
        let [h, s] = history as [number, number];
        return (<div><p>
            Loading graph ... {h} / {s}
        </p></div>);
    }
}

export default function App() {
    const classes = useStyles();
    const [startIndex, setStartIndex] = useState(
        0 as number
    );
    const [commits, setCommits] = useState(
        [] as Array<CommitResult>,
    );
    const [numPages, setNumPages] = useState(
        1
    );
    const [page, setPage] = useState(
        1
    );

    useEffect(() => {
        async function fetchData() {
            const [count, commits] = await fetchCommits(startIndex);
            setCommits(commits);
            let n = Math.ceil(count / PAGE_COMMITS_COUNT);
            if( n === 0 ) {
                n = 1;
            }
            setNumPages(n);
        }
        fetchData()
    }, [startIndex]);

    const handleChange = (event: any, value: any) => {
        let p = value as number;
        p = p - 1;        
        setStartIndex(p * PAGE_COMMITS_COUNT);
        setPage(value);
    };

    return (
        <Container maxWidth="lg">
            <Box my={4} >
                <Typography variant="h4" component="h1" gutterBottom>
                    RA Analyze Stats
                </Typography>

                <Pagination count={numPages} page={page} shape="rounded" onChange={handleChange} />
                <Container maxWidth="lg" className={classes.container}>
                    <Graph commits={commits} />
                    <MainUnit stats={commits} />
                </Container>
            </Box>
        </Container>
    );
}
