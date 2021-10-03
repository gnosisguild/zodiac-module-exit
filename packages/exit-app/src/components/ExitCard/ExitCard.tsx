import React, { useState } from 'react'
import { Card, makeStyles, Paper, Typography } from '@material-ui/core'
import { ValueLine } from '../commons/ValueLine'
import classNames from 'classnames'
import { ReactComponent as ExternalIcon } from '../../assets/icons/external-icon.svg'
import { ReactComponent as QuestionIcon } from '../../assets/icons/question-icon.svg'
import { Skeleton } from '@material-ui/lab'
import { TextField } from '../commons/input/TextField'

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginTop: theme.spacing(2.5),
  },
  description: {
    maxWidth: 300,
  },
  paper: {
    padding: theme.spacing(1),
    backgroundColor: '#F8FAFB',
  },
  loader: {
    display: 'inline-block',
    transform: 'none',
  },
}))

export const ExitCard = (): React.ReactElement => {
  const classes = useStyles()
  const [loading] = useState(true)

  const token = loading ? <Skeleton className={classes.loader} variant="text" width={80} /> : '$WORK'

  return (
    <Card>
      <Typography variant="h3">Safe Exit</Typography>
      <Typography variant="body1" className={classNames(classes.spacing, classes.description)}>
        Redeem {token} tokens for a share of the DAOs assets.
      </Typography>

      <Paper className={classNames(classes.spacing, classes.paper)}>
        <ValueLine label="Circulating Supply" loading={loading} />
        <ValueLine label="DAO Assets Value" icon={<ExternalIcon />} loading={loading} />
      </Paper>

      <Paper className={classNames(classes.spacing, classes.paper)}>
        <ValueLine label="Your Balance" loading={loading} />
        <ValueLine label="Market Value" icon={<ExternalIcon />} loading={loading} />
      </Paper>

      <TextField color="secondary" className={classes.spacing} label="Exit Amount" />

      <Paper className={classNames(classes.spacing, classes.paper)}>
        <ValueLine label="Claimable Value" icon={<QuestionIcon />} loading={loading} />
      </Paper>
    </Card>
  )
}
