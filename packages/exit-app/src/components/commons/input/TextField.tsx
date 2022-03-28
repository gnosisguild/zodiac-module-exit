import React from 'react'
import {
  Grid,
  GridProps,
  InputBase,
  InputLabel,
  makeStyles,
  StandardTextFieldProps,
  TextField as MUITextField,
  withStyles,
} from '@material-ui/core'
import classNames from 'classnames'
import { Row } from '../layout/Row'
import { Grow } from '../Grow'

const StyledTextField = withStyles((theme) => ({
  root: {
    '& label.Mui-focused': {
      position: 'relative',
      transform: 'none',
      marginBottom: theme.spacing(1),
    },
    '& label:not(.Mui-error).Mui-focused': {
      color: theme.palette.text.primary,
    },
    '& .MuiInputBase-root': {
      marginTop: 0,
      minHeight: '37px',
    },
    '& .MuiInputBase-root input': {
      fontFamily: 'Roboto Mono',
      fontSize: '14px',
    },
    '& .MuiSelect-select:focus': {
      backgroundColor: 'transparent',
    },
  },
}))(MUITextField)

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
  },
  label: {
    display: 'inline-block',
    color: theme.palette.text.primary,
  },
  inputContainer: {
    flexGrow: 1,
  },
  input: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    padding: '12px 0 12px 8px',
    border: '1px solid rgba(255,255,255,0.7)',
    fontFamily: 'Roboto Mono',
    '& input': {
      borderRightWidth: 1,
      borderRightStyle: 'solid',
      borderRightColor: theme.palette.secondary.main,
      paddingRight: theme.spacing(1),
    },
    '&:after': {
      content: '',
      display: 'none',
    },
  },
  append: {
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'Roboto Mono',
    padding: '12px 8px 12px 8px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.7)',
    borderLeftWidth: 0,
  },
}))

export interface TextFieldProps extends Omit<StandardTextFieldProps, 'variant' | 'label'> {
  label?: string
  append?: React.ReactElement | string
  AppendProps?: GridProps
  ActionButton?: React.ReactElement
}

export const TextField = ({
  InputProps,
  InputLabelProps,
  label,
  append,
  AppendProps,
  ActionButton,
  ...props
}: TextFieldProps) => {
  const classes = useStyles()

  if (props.select || append === undefined) {
    return (
      <StyledTextField
        focused={!props.disabled}
        label={label}
        placeholder={label}
        InputProps={{
          disableUnderline: true,
          ...InputProps,
        }}
        InputLabelProps={{
          shrink: true,
          ...InputLabelProps,
        }}
        {...props}
      />
    )
  }

  return (
    <div className={props.className}>
      <Row marginBottom={0.5}>
        <InputLabel {...InputLabelProps} className={classes.label}>
          {label}
        </InputLabel>
        <Grow />
        {ActionButton}
      </Row>
      <Grid container className={classes.root}>
        <Grid item className={classes.inputContainer}>
          <InputBase
            disabled={props.disabled}
            placeholder={props.placeholder}
            onClick={props.onClick}
            inputMode={props.inputMode}
            value={props.value}
            onChange={props.onChange}
            {...InputProps}
            className={classNames(classes.input, InputProps?.className)}
          />
        </Grid>
        <Grid item xs={4} {...AppendProps} className={classNames(classes.append, AppendProps?.className)}>
          {append}
        </Grid>
      </Grid>
    </div>
  )
}
