import React from 'react'
import { Button, makeStyles } from '@material-ui/core'
import ArrowUpIcon from '../../assets/icons/arrow-up.svg'
import { getSafeAppsLink } from '../../utils/safe'
import { useRootSelector } from '../../store'
import { getAccount, getChainId } from '../../store/main/selectors'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(1.5),
  },
  item: {
    padding: theme.spacing(1),
    border: '1px solid rgba(217, 212, 173, 0.3)',
  },
  text: {
    fontSize: 16,
    margin: 0,
  },
  link: {
    display: 'inline-block',
    fontSize: 16,
    marginTop: 16,
    textDecoration: 'underline',
  },
  button: {
    marginTop: theme.spacing(2),
  },
}))

export const NoModuleCard = () => {
  const classes = useStyles()
  const account = useRootSelector(getAccount)
  const chainId = useRootSelector(getChainId)
  const link = account && getSafeAppsLink(chainId, account)

  return (
    <div className={classes.root}>
      <div className={classes.item}>
        <p className={classes.text}>This account does not have the Exit module enabled.</p>
        <span className={classes.link}>Read more about Safe Exit here</span>
      </div>
      <Button
        fullWidth
        size="large"
        color="secondary"
        variant="contained"
        className={classes.button}
        href={link}
        startIcon={<img src={ArrowUpIcon} alt="arrow up" />}
      >
        Add Exit Module
      </Button>
    </div>
  )
}
