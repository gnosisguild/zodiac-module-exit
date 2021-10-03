import React from 'react'
import { TextField as MUITextField, withStyles, StandardTextFieldProps } from '@material-ui/core'

const StyledTextField = withStyles((theme) => ({
  root: {
    '& label.Mui-focused': {
      position: 'relative',
      transform: 'none',
      fontSize: theme.typography.fontSize,
      color: theme.palette.text.primary,
      marginBottom: theme.spacing(0.5),
    },
    '& .MuiInputBase-root': {
      backgroundColor: theme.palette.background.paper,
      padding: theme.spacing(1, 0, 1, 1),
      marginTop: 0,
      borderTopLeftRadius: theme.shape.borderRadius,
      borderTopRightRadius: theme.shape.borderRadius,
    },
    '& .MuiSelect-select:focus': {
      backgroundColor: 'transparent',
    },
  },
}))(MUITextField)

export interface TextFieldProps extends Omit<StandardTextFieldProps, 'variant' | 'label'> {
  label?: string
}

export const TextField = ({ InputLabelProps, label, ...props }: TextFieldProps): React.ReactElement => {
  return (
    <StyledTextField
      focused={!props.disabled}
      label={label}
      placeholder={label}
      InputLabelProps={{ shrink: true, ...InputLabelProps }}
      {...props}
    />
  )
}
