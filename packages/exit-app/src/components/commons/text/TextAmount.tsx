import React from 'react'
import { Typography, TypographyProps } from '@material-ui/core'

export const TextAmount: React.FC<TypographyProps> = ({ children, ...props }) => {
  return (
    <Typography
      variant="body2"
      {...props}
      style={{
        fontFamily: 'Roboto Mono',
        fontSize: 14,
        ...props.style,
      }}
    >
      {children}
    </Typography>
  )
}
