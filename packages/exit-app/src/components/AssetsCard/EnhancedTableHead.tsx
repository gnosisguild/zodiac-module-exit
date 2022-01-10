import React from 'react'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import { Checkbox } from '../commons/input/Checkbox'
import classNames from 'classnames'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import { Sort } from './AssetsTable'

interface EnhancedTableProps {
  classes: Record<string, string>
  numSelected: number
  onRequestSort: (event: React.MouseEvent<unknown>) => void
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void
  order: Sort
  rowCount: number
}

interface HeadCell {
  id: string
  width?: string | number
  label: string
  bgColorHeader?: string
  bgColor?: string
}

const headCells: HeadCell[] = [
  { id: 'token', label: 'Token', width: '15%' },
  { id: 'gas', label: 'Gas Cost to Claim', width: '20%' },
  { id: 'holding', label: 'Dao Holdings', width: '30%' },
  { id: 'claimable', label: 'Claimable Value', width: '30%' },
]

export function EnhancedTableHead(props: EnhancedTableProps) {
  const { classes, onSelectAllClick, order, numSelected, rowCount, onRequestSort } = props

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox" className={classes.headerBorder}>
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all desserts' }}
          />
        </TableCell>
        {headCells.map((headCell) => {
          const sortable = headCell.id === 'claimable'
          return (
            <React.Fragment key={headCell.id}>
              <TableCell
                key={headCell.id}
                width={headCell.width}
                align="right"
                padding="normal"
                className={classNames(classes.headerCell, classes.headerBorder, {
                  [classes.bgColumn]: ['gas', 'claimable'].includes(headCell.id),
                })}
                style={{ backgroundColor: headCell.bgColorHeader || headCell.bgColor }}
                sortDirection={sortable ? order : false}
              >
                {sortable ? (
                  <TableSortLabel active={sortable} direction={order} onClick={onRequestSort}>
                    {headCell.label}
                    <span className={classes.visuallyHidden}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </span>
                  </TableSortLabel>
                ) : (
                  headCell.label
                )}
              </TableCell>
            </React.Fragment>
          )
        })}
      </TableRow>
    </TableHead>
  )
}
