import React, { useState, useEffect, useRef } from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Chart from './Chart';
import { makeStyles } from '@material-ui/core/styles';
import { Paper } from '@material-ui/core';
import MainUnit from './MainUnit';
import {CommitStat, fetchCommits} from './commitStats';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    height: '240px',
  }
}))

export default function App() {
  const classes = useStyles();
  const [commits, setCommits] = useState([] as Array<CommitStat>);

  useEffect(() => {
    async function fetchData() {
        const commits = await fetchCommits();
        setCommits(commits)
    }
    fetchData()
  }, [])


  return (
    <Container maxWidth="lg">
      <Box my={4} >
        <Typography variant="h4" component="h1" gutterBottom>
          RA Analyze Stats
        </Typography>

        <Container maxWidth="lg" className={classes.container}>
          <Paper className={classes.paper}>
            <Chart commits={commits}/>
          </Paper>
          <MainUnit commits={commits}/>
        </Container>
      </Box>
    </Container>
  );
}
