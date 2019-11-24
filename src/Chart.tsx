import React from 'react';
import { LineChart, Line, XAxis, YAxis, Label, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CommitStat } from './commitStats';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
    container: {
      background: "#eee",
    },
  }))

interface ChartProps {
    commits: CommitStat[]
}

export default function Chart(props: ChartProps) {
    const classes = useStyles();
    const commits = [...props.commits];
    commits.reverse();

    return (
        <React.Fragment>
            <ResponsiveContainer className={classes.container}>
                <LineChart
                    data={commits}
                    margin={{
                        top: 16,
                        right: 16,
                        bottom: 0,
                        left: 24,
                    }}
                >
                    <XAxis dataKey="commit_sha"/>
                    <YAxis  unit="%">
                        <Label angle={270} position="left" style={{ textAnchor: 'middle' }}>
                            Error Rate
                        </Label>
                    </YAxis>
                    {/* <Bar dataKey="totalUnknown" fill="#8884d8" /> */}
                    <Line type="monotone" dataKey="errorRate" stroke="#556CD6" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </React.Fragment>
    );
}
