import { Button, makeStyles, Paper, Typography } from '@material-ui/core'
import { TextField } from '../commons/input/TextField'
import { ReactComponent as ArrowUp } from '../../assets/icons/arrow-up.svg'

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
}))

export const AttachAccount = () => {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Paper classes={{ root: classes.card }}>
        <Typography className={classes.spacing} variant="h4">
          Attach an Exit enabled Account
        </Typography>
        <Typography className={classes.spacing} variant="body1">
          Once an account is attached, you will be able to select the assets to claim, and pull them from the safe (in
          proportion to the amount of a designated token you hold).
        </Typography>

        <TextField
          className={classes.spacing}
          label="Account Address"
          placeholder="0x59C945953C10AbC7f3716a8cECd09b5eb4d865Ca"
        />

        <Button fullWidth={true} variant="contained" color="secondary" startIcon={<ArrowUp />}>
          Attach Account
        </Button>
      </Paper>
    </div>
  )
}
