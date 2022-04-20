import { Button, CircularProgress, makeStyles, Paper, Typography, Link } from '@material-ui/core'
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined'
import { TextField } from '../commons/input/TextField'
import { ReactComponent as ArrowUp } from '../../assets/icons/arrow-up.svg'
import { useRootDispatch, useRootSelector } from '../../store'
import { useEffect, useState } from 'react'
import { setAccount, setChainId } from '../../store/main'
import { REDUX_STORE } from '../../store'
import { getAccount } from '../../store/main/selectors'
import { useWallet } from '../../hooks/useWallet'
import { getExitModulesFromSafe } from '../../services/module'
import { getAddress, getEIP3770Prefix } from '../../utils/address'
import { getChainId } from '../../store/main/selectors'
import { useLocation, useNavigate } from 'react-router-dom'
import { NOT_A_SAFE_ERROR } from '../Dashboard/Dashboard'
import { NETWORK_NAME } from '../../utils/networks'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    maxWidth: 400,
    marginTop: theme.spacing(16),
    padding: theme.spacing(1.5),
  },
  spacing: {
    marginBottom: theme.spacing(2),
  },
  errorSpacing: {
    marginTop: theme.spacing(2),
  },
}))

type AttachAccountLocationState = null | {
  address: string
  error: string
}

export const AttachAccount = () => {
  const classes = useStyles()
  const { provider } = useWallet()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as AttachAccountLocationState

  const dispatch = useRootDispatch()
  const chainId = useRootSelector(getChainId)

  const [account, _setAccount] = useState(locationState?.address || getAccount(REDUX_STORE.getState()) || '')
  const [loading, setLoading] = useState(false)
  const [invalidSafe, setInvalidSafe] = useState(locationState?.error === NOT_A_SAFE_ERROR)

  const address = getAddress(account)

  useEffect(() => {
    if (address && address[1] && address[1] !== chainId) {
      dispatch(setChainId(address[1]))
    }
  }, [address, chainId, dispatch])

  useEffect(() => {
    setInvalidSafe(false)
  }, [chainId])

  const handleAttach = async () => {
    if (address && provider) {
      setLoading(true)
      setInvalidSafe(false)
      const [_address, _chainId] = address
      const prefix = getEIP3770Prefix(_chainId || chainId)
      try {
        const exitModule = await getExitModulesFromSafe(provider, _address)
        dispatch(setAccount({ account: _address, module: exitModule }))
        navigate(`/${prefix}:${_address}`)
      } catch (err) {
        console.warn('attach error', err)
        setInvalidSafe(true)
        dispatch(setAccount({ account: '', module: undefined }))
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className={classes.root}>
      <Paper classes={{ root: classes.card }}>
        <Typography className={classes.spacing} variant="h4">
          Attach a Safe to Exit{' '}
          <Link href="https://gnosis.github.io/zodiac/docs/tutorial-module-exit-app/get-started" target="_blank">
            <InfoOutlinedIcon style={{ color: 'rgba(217, 212, 173, 0.7)' }} />
          </Link>
        </Typography>
        <Typography className={classes.spacing} variant="body1">
          Enter the account address of a Safe that has the Zodiac Exit Mod enabled. If you hold assets redeemable from
          the Safe, you will be able to claim a proportional share of the digital assets the Safe holds.
        </Typography>

        <TextField
          value={account}
          className={classes.spacing}
          onChange={(evt) => _setAccount(evt.target.value)}
          label="Account Address"
          placeholder="0x59C945953C10AbC7f3716a8cECd09b5eb4d865Ca"
        />

        <Button
          fullWidth
          color="secondary"
          variant="contained"
          onClick={handleAttach}
          disabled={!address || loading}
          startIcon={loading ? <CircularProgress size={18} color="primary" /> : <ArrowUp />}
        >
          {loading ? 'Attaching Gnosis Safe...' : 'Attach Account'}
        </Button>

        {invalidSafe ? (
          <Typography align="center" color="error" className={classes.errorSpacing}>
            The account address entered is not a Safe on {NETWORK_NAME[chainId]}. Please confirm it's correct, or use
            the dropdown above to attach a Safe deployed on a different network.
          </Typography>
        ) : null}
      </Paper>
    </div>
  )
}
