import React from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import classNames from 'classnames'

interface ErrorBoxProps {
  message: string
  className?: string
}

const useStyles = makeStyles((theme) => ({
  box: {
    padding: theme.spacing(0.5),
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(176, 20, 20, 0.3)',
    backgroundColor: 'rgba(176, 20, 20, 0.1)',
  },
  message: {
    color: 'rgb(176, 20, 20)',
    fontSize: 14,
    wordBreak: 'break-word',
  },
}))

export const ErrorBox = ({ message, className }: ErrorBoxProps) => {
  const classes = useStyles()

  return (
    <div className={classNames(classes.box, className)}>
      <Typography variant="body1">Exit Error</Typography>
      <div className={classes.box}>
        <Typography variant="body1" className={classes.message}>
          {message}
        </Typography>
      </div>
    </div>
  )
}
