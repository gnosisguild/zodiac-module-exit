import React from 'react'
import { InputLabel, makeStyles, MenuItem, Select, Typography } from '@material-ui/core'
import classNames from 'classnames'
import { Link } from 'react-router-dom'
import { Row } from '../commons/layout/Row'
import ExitModuleLogo from '../../assets/images/exit-module-logo.png'
import { useRootDispatch, useRootSelector } from '../../store'
import { getAccount, getChainId, getENS, getWalletAddress } from '../../store/main/selectors'
import { EthHashInfo } from '@gnosis.pm/safe-react-components'
import { shortAddress } from '../../utils/strings'
import { setChainId } from '../../store/main'
import { NETWORK_NAME } from '../../utils/networks'

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(1, 2, 1, 1),
    borderRadius: 60,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(217, 212, 173, 0.3)',
    background: 'rgba(217, 212, 173, 0.1)',
    '&:not(:first-child)': {
      marginLeft: theme.spacing(2),
    },
  },
  leftHeader: {
    borderRadius: '60px 0 0 60px',
  },
  header: {
    padding: theme.spacing(0.5, 2, 0.5, 0.5),
    position: 'relative',
    '&::before': {
      content: '" "',
      position: 'absolute',
      zIndex: 1,
      top: '-5px',
      left: '-5px',
      right: '-5px',
      bottom: '-5px',
      borderRadius: '60px 0 0 60px',
      border: '1px solid rgba(217, 212, 173, 0.3)',
      pointerEvents: 'none',
    },
  },
  img: {
    display: 'block',
    width: 36,
    height: 36,
  },
  title: {
    marginLeft: theme.spacing(1),
  },
  notSet: {
    opacity: 0.5,
  },
  bagIcon: {
    marginLeft: theme.spacing(2),
    stroke: 'white',
  },
  circleIconContainer: {
    borderRadius: 60,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(217, 212, 173, 0.3)',
    padding: theme.spacing(0.5),
    width: 46,
    height: 46,
  },
  banner: {
    flexGrow: 1,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(217, 212, 173, 0.3)',
    background: 'rgba(217, 212, 173, 0.1)',
    marginLeft: theme.spacing(2),
    position: 'relative',
    '&::before': {
      content: '" "',
      position: 'absolute',
      zIndex: 1,
      top: '-5px',
      left: '-5px',
      right: '-5px',
      bottom: '-5px',
      border: '1px solid rgba(217, 212, 173, 0.3)',
      pointerEvents: 'none',
    },
  },
  avatar: {
    '& img': {
      width: 36,
      height: 36,
    },
  },
  robotoText: {
    fontFamily: 'Roboto Mono',
  },
  networkPickerContainer: {
    maxWidth: 180,
    padding: theme.spacing(0.5, 0.5),
  },
  networkPicker: {
    marginTop: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    fontSize: 12,
    '&:after': {
      display: 'none',
    },
  },
  accountReset: {
    display: 'flex',
    alignItems: 'center',
    color: 'white',
    textDecoration: 'none',
  }
}))

export const Header = () => {
  const classes = useStyles()
  const account = useRootSelector(getAccount)
  const ens = useRootSelector(getENS)
  const wallet = useRootSelector(getWalletAddress)
  const chainId = useRootSelector(getChainId)

  const dispatch = useRootDispatch()

  const handleNetworkChange = (value: string) => {
    dispatch(setChainId(parseInt(value)))
  }

  return (
    <Row className={classes.root}>
      <div className={classNames(classes.container, classes.header, classes.leftHeader)}>
        <div className={classes.circleIconContainer}>
          <img src={ExitModuleLogo} alt="Zodiac App Logo" className={classes.img} />
        </div>
        <Typography variant="h5" className={classes.title}>
          Exit
        </Typography>
      </div>
      <div className={classes.banner} />
      <div className={classNames(classes.banner, classes.networkPickerContainer)}>
        <InputLabel shrink>Network</InputLabel>
        <Select
          disableUnderline
          className={classes.networkPicker}
          disabled={!!account}
          value={chainId}
          onChange={(evt) => handleNetworkChange(evt.target.value as string)}
        >
          {Object.entries(NETWORK_NAME).map((pair) => (
            <MenuItem key={pair[0]} value={pair[0]}>
              {pair[1]}
            </MenuItem>
          ))}
        </Select>
      </div>
      <div className={classNames(classes.container, classes.header, classes.leftHeader)}>

      <Link to='/' className={classes.accountReset}>
        <div className={classes.circleIconContainer}>
          {account ? (
            <EthHashInfo
              className={classes.avatar}
              hash={account}
              showAvatar
              showCopyBtn={false}
              showHash={false}
              avatarSize="md"
            />
          ) : null}
        </div>
        {account ? (
          
          <Typography variant="body1" className={classNames(classes.title, classes.robotoText)}>
            {shortAddress(account)}
          </Typography>
        ) : (
          <Typography variant="body1" className={classNames(classes.title, classes.notSet)}>
            No Safe Attached
          </Typography>
        )}
        </Link>
      </div>
      <div className={classNames(classes.container, classes.header, classes.leftHeader)}>
        <div className={classes.circleIconContainer}>
          {wallet ? (
            <EthHashInfo
              className={classes.avatar}
              hash={wallet}
              showAvatar
              showCopyBtn={false}
              showHash={false}
              avatarSize="md"
            />
          ) : null}
        </div>
        {wallet ? (
          <Typography variant="body1" className={classNames(classes.title, classes.robotoText)}>
            {ens || shortAddress(wallet)}
          </Typography>
        ) : (
          <Typography variant="body1" className={classNames(classes.title, classes.notSet)}>
            No wallet connected
          </Typography>
        )}
      </div>
    </Row>
  )
}
