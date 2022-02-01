import { TextField } from '../../commons/input/TextField'

import { makeStyles, MenuItem } from '@material-ui/core'
import { useRootDispatch, useRootSelector } from '../../../store'
import { setClaimToken } from '../../../store/main'
import { getClaimToken, getDesignatedToken, getTokens } from '../../../store/main/selectors'

// import NFTImage1 from '../../../assets/images/nft-test.png'
// import NFTImage2 from '../../../assets/images/nft-test-2.png'

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginTop: theme.spacing(2.5),
  },
  nft: {
    padding: theme.spacing(0.5),
    border: '1px solid grey',
    verticalAlign: 'middle',
    marginRight: theme.spacing(1),
    maxHeight: '100%',
  },
}))

export const ClaimTokenSelect = () => {
  const classes = useStyles()
  const dispatch = useRootDispatch()

  const designatedToken = useRootSelector(getDesignatedToken)
  const token = useRootSelector(getClaimToken)
  const availableTokens = useRootSelector(getTokens)

  const handleTokenChange = (value: string) => {
    dispatch(setClaimToken(value))
  }

  return (
    <TextField
      select
      className={classes.spacing}
      value={token}
      onChange={(evt) => handleTokenChange(evt.target.value)}
      label="Exit Token"
    >
      {!availableTokens.length ? (
        <MenuItem value={undefined} disabled>
          No available tokens
        </MenuItem>
      ) : null}
      {availableTokens.map((tokenId) => (
        <MenuItem key={tokenId} value={tokenId} selected={tokenId === token}>
          {/*<img src={NFTImage1} alt="NFTImage1" className={classes.nft} />*/}
          {designatedToken?.symbol} #{tokenId}
        </MenuItem>
      ))}
      {/*<MenuItem value="4">*/}
      {/*  <img src={NFTImage2} alt="NFTImage1" className={classes.nft} />*/}
      {/*  NFT #2*/}
      {/*</MenuItem>*/}
    </TextField>
  )
}
