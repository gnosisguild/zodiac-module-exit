import React from 'react'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell, { TableCellProps } from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import Paper from '@material-ui/core/Paper'
import Checkbox from '@material-ui/core/Checkbox'
import classNames from 'classnames'

interface Amount {
  amount: number
  unit: string
}

interface Data {
  token: string
  gas: Amount
  dao: Amount
  claim: Amount
}

interface HeadCell {
  id: keyof Data
  label: string
  bgColorHeader?: string
  bgColor?: string
}

type Order = 'asc' | 'desc'

function createData(token: string, gas: number, dao: number, claim: number): Data {
  const createAmount = (amount: number): Amount => ({ unit: 'ETH', amount: amount })
  return { token, gas: createAmount(gas), dao: createAmount(dao), claim: createAmount(claim) }
}

const rows = [
  createData('Cupcake', 305, 3.7, 67),
  createData('Donut', 452, 25.0, 51),
  createData('Eclair', 262, 16.0, 24),
  createData('Frozen yoghurt', 159, 6.0, 24),
  createData('Gingerbread', 356, 16.0, 49),
  createData('Honeycomb', 408, 3.2, 87),
  createData('Ice cream sandwich', 237, 9.0, 37),
  createData('Jelly Bean', 375, 0.0, 94),
  createData('KitKat', 518, 26.0, 65),
  createData('Lollipop', 392, 0.2, 98),
  createData('Marshmallow', 318, 0, 81),
  createData('Nougat', 360, 19.0, 9),
  createData('Oreo', 437, 18.0, 63),
]

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
): (a: { [key in Key]: string | Amount }, b: { [key in Key]: string | Amount }) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number])
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) return order
    return a[1] - b[1]
  })
  return stabilizedThis.map((el) => el[0])
}

const headCells: HeadCell[] = [
  { id: 'token', label: 'Token', bgColorHeader: '#E8FAF9', bgColor: '#F7FFFE' },
  { id: 'gas', label: 'Gas Cost to Claim', bgColorHeader: '#FAF8E8', bgColor: '#FEFDF7' },
  { id: 'dao', label: 'Dao Holdings', bgColorHeader: '#EDF0FF', bgColor: '#F9FAFF' },
  { id: 'claim', label: 'Claimable Value', bgColorHeader: '#E3F5E1', bgColor: '#F7FFF7' },
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
          <>
            <TableCell
              key={headCell.id}
              align="right"
              padding="normal"
              className={classNames(classes.headerCell, classes.headerBorder)}
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
          </>
        ))}
      </TableRow>
    </TableHead>
  )
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    paper: {
      width: '100%',
      marginBottom: theme.spacing(2),
    },
    table: {
      minWidth: 750,
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
    <Paper className={classes.paper}>
      <TableContainer>
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
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={row.token}
                  selected={isItemSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }} />
                  </TableCell>
                  <TableCell
                    component="th"
                    id={labelId}
                    scope="row"
                    align="right"
                    style={{ backgroundColor: headCells[0].bgColor }}
                  >
                    {row.token}
                  </TableCell>
                  <TableSpaceCell />
                  <TableCell align="right" style={{ backgroundColor: headCells[1].bgColor }}>
                    {row.gas.amount} {row.gas.unit}
                  </TableCell>
                  <TableSpaceCell />
                  <TableCell align="right" style={{ backgroundColor: headCells[2].bgColor }}>
                    {row.dao.amount} {row.dao.unit}
                  </TableCell>
                  <TableSpaceCell />
                  <TableCell align="right" style={{ backgroundColor: headCells[3].bgColor }}>
                    {row.claim.amount} {row.claim.unit}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
