import { TextField } from '../../commons/input/TextField'
import { makeStyles, MenuItem } from '@material-ui/core'
import { useRootDispatch, useRootSelector } from '../../../store'
import { setClaimToken } from '../../../store/main'
import { getClaimToken, getDesignatedToken, getTokens } from '../../../store/main/selectors'

interface ClaimTokenSelectProps {
  disabled?: boolean
}

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginTop: theme.spacing(2.5),
  },
  nft: {
    boxSizing: 'border-box',
    border: '1px solid grey',
    verticalAlign: 'middle',
    padding: theme.spacing(0.5),
    marginRight: theme.spacing(1),
    maxHeight: 72,
    maxWidth: 180,
  },
  select: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(217, 212, 173, 0.7)',
    padding: 8,
    '&:after': {
      content: 'none',
    },
    '&:hover': {
      borderColor: theme.palette.common.white,
    },
  },
  item: {
    maxHeight: 80,
    padding: '8px 4px',
  },
  list: {
    padding: 3,
  },
}))

export const ClaimTokenSelect = ({ disabled }: ClaimTokenSelectProps) => {
  const classes = useStyles()
  const dispatch = useRootDispatch()

  const designatedToken = useRootSelector(getDesignatedToken)
  const token = useRootSelector(getClaimToken)
  const availableTokens = useRootSelector(getTokens)

  const handleTokenChange = (value: string) => dispatch(setClaimToken(value))

  return (
    <TextField
      select
      className={classes.spacing}
      InputProps={{ disabled: !token || disabled, classes: { root: classes.select } }}
      onChange={(evt) => handleTokenChange(evt.target.value)}
      SelectProps={{
        MenuProps: {
          classes: { list: classes.list },
        },
      }}
      value={token || 'none'}
      label="Exit Token"
    >
      {!availableTokens.length ? (
        <MenuItem value="none" disabled>
          - No tokens -
        </MenuItem>
      ) : null}
      {availableTokens.map((availableToken) => (
        <MenuItem
          className={classes.item}
          key={availableToken.tokenId}
          value={availableToken.tokenId}
          selected={availableToken.tokenId === token}
        >
          {availableToken.imgUrl ? (
            <img src={availableToken.imgUrl} alt={availableToken.tokenId} className={classes.nft} />
          ) : null}
          {designatedToken?.name || designatedToken?.symbol} #{availableToken.tokenId}
        </MenuItem>
      ))}
    </TextField>
  )
}
