import React, { useMemo } from 'react'
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
import { BigNumber, BigNumberish } from 'ethers'
import { SafeAssets, Token, TokenAsset } from '../../store/main/models'
import { ethers } from 'ethers/lib.esm'
import { useRootDispatch, useRootSelector } from '../../store'
import { getClaimAmount, getSelectedTokens } from '../../store/main/selectors'
import { Typography } from '@material-ui/core'
import { Row } from '../commons/layout/Row'
import { TextAmount } from '../commons/text/TextAmount'
import { balanceFormatter, fiatFormatter } from '../../utils/format'
import { setSelectedTokens } from '../../store/main'

interface HeadCell {
  id: string
  width?: string | number
  label: string
  bgColorHeader?: string
  bgColor?: string
}

interface RowAmount {
  value: string
  fiat: string
}

interface RowItem {
  address: string
  symbol: string
  symbolLogoUrl?: string
  gas: RowAmount
  holding: RowAmount
  claimable: RowAmount
}

type Sort = 'asc' | 'desc'

function descendingComparator(a: string, b: string) {
  const valueA = parseFloat(a)
  const valueB = parseFloat(b)
  if (valueA === valueB) return 0
  return valueA > valueB ? -1 : 1
}

function getComparator(order: Sort): (a: RowItem, b: RowItem) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a.claimable.fiat, b.claimable.fiat)
    : (a, b) => -descendingComparator(a.claimable.fiat, b.claimable.fiat)
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
  { id: 'token', label: 'Token', width: '15%' },
  { id: 'gas', label: 'Gas Cost to Claim', width: '20%' },
  { id: 'holding', label: 'Dao Holdings', width: '30%' },
  { id: 'claimable', label: 'Claimable Value', width: '30%' },
]

interface EnhancedTableProps {
  classes: ReturnType<typeof useStyles>
  numSelected: number
  onRequestSort: (event: React.MouseEvent<unknown>) => void
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void
  order: Sort
  rowCount: number
}

const TableSpaceCell = (props: TableCellProps) => <TableCell padding="none" style={{ minWidth: 8 }} {...props} />

function EnhancedTableHead(props: EnhancedTableProps) {
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
                <TableSortLabel active={sortable} direction={order} onClick={onRequestSort}>
                  {headCell.label}
                  {sortable ? (
                    <span className={classes.visuallyHidden}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </span>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableSpaceCell className={classes.headerBorder} />
            </React.Fragment>
          )
        })}
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
    tokenLogo: {
      width: 20,
      verticalAlign: 'middle',
      marginRight: theme.spacing(1),
    },
    symbolText: {
      display: 'inline',
    },
  }),
)

interface AssetsTableProps {
  assets: SafeAssets
  totalSupply: string
  token: Token
}

function formatRowAmount(token?: TokenAsset, amount?: BigNumberish): RowAmount {
  if (!token || !amount) return { value: '0', fiat: '0' }
  const value = ethers.utils.formatUnits(amount, token.tokenInfo.decimals)
  const fiat = parseFloat(value) * parseFloat(token.fiatConversion)
  return {
    value: balanceFormatter.format(parseFloat(value)),
    fiat: fiatFormatter.format(fiat),
  }
}

function getClaimableAmount(claimRate: ethers.FixedNumber, balance: BigNumberish) {
  return claimRate
    .mulUnsafe(ethers.FixedNumber.from(BigNumber.from(balance)))
    .toString()
    .split('.')[0]
}

export function AssetsTable({ assets, totalSupply, token }: AssetsTableProps): React.ReactElement {
  const classes = useStyles()
  const [sort, setSort] = React.useState<Sort>('asc')

  const dispatch = useRootDispatch()
  const selected = useRootSelector(getSelectedTokens)
  const claimAmount = useRootSelector(getClaimAmount)

  const claimRate = useMemo(() => {
    const amount = ethers.utils.parseUnits(claimAmount, token.decimals)
    const cs = BigNumber.from(totalSupply)
    if (amount.gt(cs)) return ethers.FixedNumber.fromValue(BigNumber.from(1))
    const fnAmount = ethers.FixedNumber.fromValue(amount, 18)
    const fnCS = ethers.FixedNumber.fromValue(cs, 18)
    return fnAmount.divUnsafe(fnCS)
  }, [claimAmount, totalSupply, token])

  const rows = useMemo((): RowItem[] => {
    return assets.items
      .filter((assetToken) => token.address !== assetToken.tokenInfo.address)
      .map((token): RowItem => {
        const claimable = getClaimableAmount(claimRate, token.balance)
        return {
          address: token.tokenInfo.address,
          symbol: token.tokenInfo.symbol,
          symbolLogoUrl: token.tokenInfo.logoUri,
          claimable: formatRowAmount(token, claimable),
          gas: formatRowAmount(token, '0'),
          holding: formatRowAmount(token, token.balance),
        }
      })
  }, [assets.items, claimRate, token.address])

  const totals = useMemo(() => {
    const tokenAsset = assets.items.find((asset) => asset.tokenInfo.symbol === 'ETH')
    const tokens = selected
      .map((address) => {
        return assets.items.find((tokenAsset) => tokenAsset.tokenInfo.address === address)
      })
      .filter((token): token is TokenAsset => token !== undefined)

    const gasTotal = tokens.reduce((acc, token) => acc.add(token.gas), BigNumber.from(0))
    const claimableTotal = tokens.reduce(
      (acc, token) => acc.add(getClaimableAmount(claimRate, token.balance)),
      BigNumber.from(0),
    )
    const holdingTotal = tokens.reduce((acc, token) => acc.add(token.balance), BigNumber.from(0))

    return {
      holding: formatRowAmount(tokenAsset, holdingTotal),
      gas: formatRowAmount(tokenAsset, gasTotal),
      claimable: formatRowAmount(tokenAsset, claimableTotal),
    }
  }, [assets.items, claimRate, selected])

  const handleRequestSort = () => setSort(sort === 'asc' ? 'desc' : 'asc')

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const addresses = rows.map((n) => n.address)
      dispatch(setSelectedTokens(addresses))
      return
    }
    dispatch(setSelectedTokens([]))
  }

  const handleClick = (event: React.MouseEvent<unknown>, address: string) => {
    const selectedIndex = selected.indexOf(address)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, address)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1))
    }

    dispatch(setSelectedTokens(newSelected))
  }

  const isSelected = (address: string) => selected.indexOf(address) !== -1

  return (
    <TableContainer className={classes.root}>
      <Table className={classes.table} aria-labelledby="tableTitle" aria-label="enhanced table">
        <EnhancedTableHead
          classes={classes}
          numSelected={selected.length}
          order={sort}
          onSelectAllClick={handleSelectAllClick}
          onRequestSort={handleRequestSort}
          rowCount={assets.items.length}
        />
        <TableBody>
          {stableSort(rows, getComparator(sort)).map((row, index) => {
            const isItemSelected = isSelected(row.address)
            const labelId = `enhanced-table-checkbox-${index}`

            return (
              <TableRow
                hover
                onClick={(event) => handleClick(event, row.address)}
                className={classNames({ [classes.transparent]: !isItemSelected })}
                role="checkbox"
                aria-checked={isItemSelected}
                tabIndex={-1}
                key={row.symbol}
                selected={isItemSelected}
              >
                <TableCell padding="checkbox">
                  <Checkbox checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }} />
                </TableCell>
                <TableCell id={labelId} scope="row" align="right">
                  <Row justifyContent="end" alignItems="center">
                    {row.symbolLogoUrl ? <img src={row.symbolLogoUrl} alt="" className={classes.tokenLogo} /> : null}
                    <Typography className={classes.symbolText} variant="body1">
                      {row.symbol}
                    </Typography>
                  </Row>
                </TableCell>
                <TableSpaceCell />
                <TableCell className={classes.bgColumn} align="right">
                  <TextAmount>
                    {row.gas.value} {row.symbol} ${row.gas.fiat}
                  </TextAmount>
                </TableCell>
                <TableSpaceCell />
                <TableCell align="right">
                  <TextAmount>
                    {row.holding.value} {row.symbol} ${row.holding.fiat}
                  </TextAmount>
                </TableCell>
                <TableSpaceCell />
                <TableCell className={classes.bgColumn} align="right">
                  <TextAmount>
                    {row.claimable.value} {row.symbol} ${row.claimable.fiat}
                  </TextAmount>
                </TableCell>
              </TableRow>
            )
          })}

          <TableRow role="checkbox" tabIndex={-1}>
            <TableCell padding="checkbox" />
            <TableCell scope="row" align="right">
              <Row justifyContent="end" alignItems="center">
                <Typography className={classes.symbolText} variant="body1">
                  {selected.length} tokens
                </Typography>
              </Row>
            </TableCell>
            <TableSpaceCell />
            <TableCell className={classes.bgColumn} align="right">
              <TextAmount>
                {totals.gas.value} gwai ${totals.gas.fiat}
              </TextAmount>
            </TableCell>
            <TableSpaceCell />
            <TableCell align="right">
              <TextAmount>
                {totals.holding.value} ETH ${totals.holding.fiat}
              </TextAmount>
            </TableCell>
            <TableSpaceCell />
            <TableCell className={classes.bgColumn} align="right">
              <TextAmount>
                {totals.claimable.value} ETH ${totals.claimable.fiat}
              </TextAmount>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}
