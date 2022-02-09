import React from 'react'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import { Link, TableBody, Typography } from '@material-ui/core'
import { useRootDispatch } from '../../store'
import { setCustomTokenModalOpen } from '../../store/main'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    detail: {
      marginTop: theme.spacing(2),
    },
    cell: {
      opacity: 0.8,
      backgroundColor: 'rgba(217, 212, 173, 0.1)',
    },
  }),
)

export function EmptyTableContent(): React.ReactElement {
  const classes = useStyles()
  const dispatch = useRootDispatch()
  const handleOpen = () => dispatch(setCustomTokenModalOpen(true))

  return (
    <TableBody>
      <TableRow role="checkbox" tabIndex={-1}>
        <TableCell colSpan={9} scope="row" align="center" className={classes.cell}>
          <Typography>No Assets Found</Typography>
          <Typography className={classes.detail}>
            Expect to see a token here? You may need <br /> to{' '}
            <Link underline="always" color="textPrimary" onClick={handleOpen}>
              add a custom token
            </Link>
            .
          </Typography>
        </TableCell>
      </TableRow>
    </TableBody>
  )
}
