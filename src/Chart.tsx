import React from 'react';
import { LineChart, Line, XAxis, YAxis, Label, ResponsiveContainer } from 'recharts';
import { CommitHistory } from './commitStats';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
    container: {
      background: "#eee",
    },
  }))

interface ChartProps {
    history: CommitHistory
}

export default function Chart(props: ChartProps) {
    const classes = useStyles();
    const commits = [...props.history.commits];
    commits.reverse();

    const tickFormatter = (data:string) : string => {
        return data;
    }

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
                    <XAxis dataKey="commit_sha" interval={0} tickFormatter={tickFormatter}  angle={90} dy={33} dx={7} height={100}/>
                    <YAxis  unit="%">
                        <Label angle={270} position="left" style={{ textAnchor: 'middle' }}>
                            Unknown + Partial
                        </Label>
                    </YAxis>
                    {/* <Bar dataKey="totalUnknown" fill="#8884d8" /> */}
                    <Line type="monotone" dataKey="errorRate" stroke="#556CD6" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </React.Fragment>
    );
}
