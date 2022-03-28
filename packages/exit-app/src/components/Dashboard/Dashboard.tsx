import { Grid, makeStyles } from '@material-ui/core'
import { AssetsCard } from '../AssetsCard/AssetsCard'
import React, { useEffect } from 'react'
import { useRootSelector } from '../../store'
import { getAccount, getChainId, getLoading, getModule } from '../../store/main/selectors'
import { NoModuleCard } from '../ExitCard/NoModuleCard'
import { ExitCard } from '../ExitCard/ExitCard'
import { useNavigate, useParams } from 'react-router-dom'
import { getAddress } from '../../utils/address'
import { getExitModulesFromSafe } from '../../services/module'
import { setAccount, setChainId, setLoading } from '../../store/main'
import { useDispatch } from 'react-redux'
import { useWallet } from '../../hooks/useWallet'

export const NOT_A_SAFE_ERROR = 'NOT_A_SAFE_ERROR'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  container: {
    position: 'relative',
    '&::before': {
      content: '" "',
      position: 'absolute',
      zIndex: 1,
      top: '0px',
      left: '0px',
      right: '0px',
      bottom: '0px',
      border: '1px solid rgba(217, 212, 173, 0.3)',
      pointerEvents: 'none',
    },
  },
  item: {
    border: '1px solid rgba(217, 212, 173, 0.3)',
    height: '100%',
  },
  space: {
    marginTop: theme.spacing(3),
  },
  tableCard: {
    paddingLeft: '0px !important',
  },
}))

const LeftPanel = () => {
  const module = useRootSelector(getModule)
  const loading = useRootSelector(getLoading)

  if (!module && !loading) {
    return <NoModuleCard />
  }

  return <ExitCard />
}

export const Dashboard = () => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const stateAccount = useRootSelector(getAccount)
  const stateChainId = useRootSelector(getChainId)
  const loading = useRootSelector(getLoading)
  const { provider } = useWallet()
  const { account } = useParams()

  useEffect(() => {
    if (!account || !provider) return
    const address_EIP3770 = getAddress(account)
    // if invalid EIP3770 address
    if (!address_EIP3770 || !address_EIP3770[1]) {
      navigate('/')
      dispatch(setLoading(false))
      return
    }
    const [address, chainId] = address_EIP3770

    if (stateAccount && stateAccount === address && stateChainId === chainId) {
      // Do nothing, everything is fine
      return
    }

    if (!loading) dispatch(setLoading(true))

    // update
    if (stateChainId !== chainId) {
      dispatch(setChainId(chainId))
      return
    }

    getExitModulesFromSafe(provider, address)
      .then((exitModule) => {
        dispatch(setAccount({ account: address, module: exitModule }))
      })
      .catch((err) => {
        console.error('attach error', err)
        navigate('/', { state: { address, error: NOT_A_SAFE_ERROR } })
        dispatch(setLoading(false))
      })
  }, [account, dispatch, loading, navigate, provider, stateAccount, stateChainId])

  return (
    <Grid container spacing={1} className={classes.container}>
      <Grid item xs={4}>
        <div className={classes.item}>
          <LeftPanel />
        </div>
      </Grid>
      <Grid item xs={8} className={classes.tableCard}>
        <div className={classes.item}>
          <AssetsCard safe={stateAccount} />
        </div>
      </Grid>
    </Grid>
  )
}
