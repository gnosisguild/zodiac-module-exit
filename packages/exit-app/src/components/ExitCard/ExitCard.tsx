import React, { useState } from 'react'
import { Button, makeStyles, Typography } from '@material-ui/core'
import { ValueLine } from '../commons/ValueLine'
import classNames from 'classnames'
import { ReactComponent as ExternalIcon } from '../../assets/icons/external-icon.svg'
import { ReactComponent as QuestionIcon } from '../../assets/icons/question-icon.svg'
import { Skeleton } from '@material-ui/lab'
import { TextField } from '../commons/input/TextField'
import ArrowUpIcon from '../../assets/icons/arrow-up.svg'
import { WalletAssets } from './WalletAssets'

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginTop: theme.spacing(2.5),
  },
  description: {
    maxWidth: 300,
  },
  content: {
    border: '1px solid rgba(217, 212, 173, 0.3)',
    padding: theme.spacing(1.5),
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
    <div>
      <Typography variant="body1" className={classes.description}>
        Redeem your {token} tokens for a share of the DAOs assets.
      </Typography>

      <div className={classNames(classes.spacing, classes.content)}>
        <ValueLine label="Circulating Supply" loading={loading} />
        <ValueLine label="DAO Assets Value" icon={<ExternalIcon />} loading={loading} />
      </div>

      <WalletAssets className={classNames(classes.spacing, classes.content)} loading={loading} />

      <TextField color="secondary" className={classes.spacing} label="Exit Amount" />

      <div className={classNames(classes.spacing, classes.content)}>
        <ValueLine label="Claimable Value" icon={<QuestionIcon />} loading={loading} />
      </div>

      <Button
        fullWidth
        size="large"
        color="secondary"
        variant="contained"
        className={classes.spacing}
        startIcon={<img src={ArrowUpIcon} alt="arrow up" />}
      >
        Exit and Claim Assets
      </Button>
    </div>
  )
}
