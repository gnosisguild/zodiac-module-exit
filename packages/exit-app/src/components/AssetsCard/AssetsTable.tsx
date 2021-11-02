import React from 'react'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell, { TableCellProps } from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import classNames from 'classnames'
import { Checkbox } from '../commons/input/Checkbox'

interface Amount {
  amount: number
  unit: string
}

interface Data {
  token: string
  gas: number
  dao: number
  claim: number
}

interface HeadCell {
  id: keyof Data
  label: string
  bgColorHeader?: string
  bgColor?: string
}

type Order = 'asc' | 'desc'

function createData(token: string, gas: number, dao: number, claim: number): Data {
  return { token, gas, dao, claim }
}

const rows = [createData('ETH', 80000, 100, 10), createData('UNI', 80000, 300, 30), createData('USDT', 80000, 100, 10)]

function isAmount(value?: Partial<Amount>): value is Amount {
  return !!(value && value.amount !== undefined && value.unit !== undefined)
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const fieldA = a[orderBy]
  const fieldB = b[orderBy]
  const valueA = isAmount(fieldA) ? (fieldA as Amount).amount : fieldA
  const valueB = isAmount(fieldB) ? (fieldB as Amount).amount : fieldB

  if (valueB < valueA) return -1
  if (valueB > valueA) return 1
  return 0
}

function getComparator<Key extends keyof never>(
  order: Order,
  orderBy: Key,
): (a: { [key in Key]: string | number }, b: { [key in Key]: string | number }) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number): T[] {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number])
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) return order
    return a[1] - b[1]
  })
  return stabilizedThis.map((el) => el[0])
}

const headCells: HeadCell[] = [
  { id: 'token', label: 'Token' },
  { id: 'gas', label: 'Gas Cost to Claim' },
  { id: 'dao', label: 'Dao Holdings' },
  { id: 'claim', label: 'Claimable Value' },
]

interface EnhancedTableProps {
  classes: ReturnType<typeof useStyles>
  numSelected: number
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void
  order: Order
  orderBy: string
  rowCount: number
}

const TableSpaceCell = (props: TableCellProps) => <TableCell padding="none" style={{ minWidth: 8 }} {...props} />

function EnhancedTableHead(props: EnhancedTableProps) {
  const { classes, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props
  const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property)
  }

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
        {headCells.map((headCell) => (
          <React.Fragment key={headCell.id}>
            <TableCell
              key={headCell.id}
              align="right"
              padding="normal"
              className={classNames(classes.headerCell, classes.headerBorder, {
                [classes.bgColumn]: ['gas', 'claim'].includes(headCell.id),
              })}
              style={{ backgroundColor: headCell.bgColorHeader || headCell.bgColor }}
              sortDirection={orderBy === headCell.id ? order : false}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <span className={classes.visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </span>
                ) : null}
              </TableSortLabel>
            </TableCell>
            <TableSpaceCell className={classes.headerBorder} />
          </React.Fragment>
        ))}
      </TableRow>
    </TableHead>
  )
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(2),
    },
    paper: {
      width: '100%',
      marginBottom: theme.spacing(2),
    },
    table: {
      minWidth: 750,
    },
    transparent: {
      opacity: 0.5,
    },
    bgColumn: {
      backgroundColor: 'rgba(217, 212, 173, 0.1)',
    },
    visuallyHidden: {
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: 1,
      margin: -1,
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      top: 20,
      width: 1,
    },
    headerCell: {
      padding: theme.spacing(1, 2),
    },
    headerBorder: {
      borderTop: '1px solid rgba(81, 81, 81, 1)',
      boxShadow: 'inset 0px 1px 0px rgb(40 54 61 / 50%), inset 0px -1px 0px rgb(40 54 61 / 50%)',
    },
  }),
)

export function AssetsTable(): React.ReactElement {
  const classes = useStyles()
  const [order, setOrder] = React.useState<Order>('asc')
  const [orderBy, setOrderBy] = React.useState<keyof Data>('claim')
  const [selected, setSelected] = React.useState<string[]>([])

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.token)
      setSelected(newSelecteds)
      return
    }
    setSelected([])
  }

  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1))
    }

    setSelected(newSelected)
  }

  const isSelected = (name: string) => selected.indexOf(name) !== -1

  return (
    <TableContainer className={classes.root}>
      <Table className={classes.table} aria-labelledby="tableTitle" aria-label="enhanced table">
        <EnhancedTableHead
          classes={classes}
          numSelected={selected.length}
          order={order}
          orderBy={orderBy}
          onSelectAllClick={handleSelectAllClick}
          onRequestSort={handleRequestSort}
          rowCount={rows.length}
        />
        <TableBody>
          {stableSort(rows, getComparator(order, orderBy)).map((row, index) => {
            const isItemSelected = isSelected(row.token)
            const labelId = `enhanced-table-checkbox-${index}`

            return (
              <TableRow
                hover
                onClick={(event) => handleClick(event, row.token)}
                className={classNames({ [classes.transparent]: !isItemSelected })}
                role="checkbox"
                aria-checked={isItemSelected}
                tabIndex={-1}
                key={row.token}
                selected={isItemSelected}
              >
                <TableCell padding="checkbox">
                  <Checkbox checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }} />
                </TableCell>
                <TableCell id={labelId} scope="row" align="right">
                  {row.token}
                </TableCell>
                <TableSpaceCell />
                <TableCell className={classes.bgColumn} align="right">
                  {row.gas} ETH
                </TableCell>
                <TableSpaceCell />
                <TableCell align="right">
                  {row.dao} {row.token}
                </TableCell>
                <TableSpaceCell />
                <TableCell className={classes.bgColumn} align="right">
                  {row.claim} {row.token}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
