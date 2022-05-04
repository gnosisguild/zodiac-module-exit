import React, { useMemo } from 'react'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import classNames from 'classnames'
import { ZodiacCheckbox } from 'zodiac-ui-components'
import { BigNumber, BigNumberish, ethers } from 'ethers'
import { Token, TokenAsset } from '../../store/main/models'
import { useRootDispatch, useRootSelector } from '../../store'
import { getSelectedTokens } from '../../store/main/selectors'
import {
  Table,
  TableBody,
  TableCell,
  TableCellProps,
  TableContainer,
  TableFooter,
  TableRow,
  Typography,
} from '@material-ui/core'
import { Row } from '../commons/layout/Row'
import { TextAmount } from '../commons/text/TextAmount'
import { balanceFormatter, fiatFormatter, integerFormatter } from '../../utils/format'
import { setSelectedTokens } from '../../store/main'
import { EnhancedTableHead } from './EnhancedTableHead'
import { EmptyTableContent } from './EmptyTableContent'
import { useAmountRate } from '../../hooks/useAmountRate'

interface RowAmount {
  value: string
  fiat: string
}

interface RowItem {
  address: string
  name?: string
  symbol: string
  symbolLogoUrl?: string
  gas: RowAmount
  holding: RowAmount
  claimable: RowAmount
}

export type Sort = 'asc' | 'desc'

function descendingComparator(a: string, b: string) {
  const valueA = parseFloat(a)
  const valueB = parseFloat(b)
  if (valueA === valueB) return 0
  return valueA > valueB ? -1 : 1
}

function getComparator(order: Sort): (a: RowItem, b: RowItem) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a.holding.fiat, b.holding.fiat)
    : (a, b) => -descendingComparator(a.holding.fiat, b.holding.fiat)
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

export const TableScrollSpacer = (props: TableCellProps) => (
  <TableCell padding="none" style={{ minWidth: 10 }} {...props} />
)

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(2),
      backgroundImage:
        'linear-gradient(to right, #ffffff00, #ffffff00), linear-gradient(to right, #ffffff00, #ffffff00), linear-gradient(to right, rgb(131 134 98 / 50%), rgba(255, 255, 255, 0)), linear-gradient(to left, rgb(131 134 98 / 50%), rgba(255, 255, 255, 0))',
      backgroundPosition: 'left center, right center, left center, right center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#ffffff00',
      backgroundSize: '20px 100%, 20px 100%, 10px 100%, 10px 100%',
      backgroundAttachment: 'local, local, scroll, scroll',
    },
    paper: {
      width: '100%',
      marginBottom: theme.spacing(2),
    },
    table: {
      minWidth: 750,
    },
    blur: {
      opacity: 0.5,
    },
    bgTransparent: {
      background: 'transparent !important',
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
    noBorder: {
      border: 'none',
      boxShadow: 'none',
    },
    tokenLogo: {
      width: 20,
      verticalAlign: 'middle',
      marginRight: theme.spacing(1),
    },
    symbolText: {
      display: 'inline',
    },
    summationSymbol: {
      fontFamily: 'Averta',
    },
    footerCell: {
      padding: theme.spacing(1),
    },
    bodyCell: {
      padding: theme.spacing(1.5, 1),
    },
    checkCell: {
      padding: theme.spacing(1.5, 1, 1.5, 0.5),
      '& .MuiCheckbox-root': {
        padding: 0,
      }
    },
    startScrollSpacer: {
      background: '#0e1418',
      borderTop: '1px solid rgba(81, 81, 81, 1)',
    },
    endScrollSpacer: {
      background: '#281f16',
      borderTop: '1px solid rgba(81, 81, 81, 1)',
    },
  }),
)

interface AssetsTableProps {
  fiat: string
  assets: TokenAsset[]
  token?: Token
  query?: string
}

function getFiatAmount(token: TokenAsset, amount?: BigNumberish): number {
  if (amount === undefined) {
    return parseFloat(token.fiatBalance)
  }
  return parseFloat(token.fiatConversion) * parseFloat(ethers.utils.formatUnits(amount, token.tokenInfo.decimals))
}

function formatRowAmount(token?: TokenAsset, amount?: BigNumberish, decimals?: number, showDecimals = true): RowAmount {
  if (!token || !amount) return { value: '0', fiat: '0' }
  if (!decimals) decimals = token.tokenInfo.decimals
  const value = ethers.utils.formatUnits(amount, decimals)
  const fiat = getFiatAmount(token, amount)
  const valueFormatter = showDecimals ? balanceFormatter : integerFormatter
  return {
    value: valueFormatter.format(parseFloat(value)),
    fiat: fiatFormatter.format(fiat),
  }
}

function formatRowFiatAmount(token?: TokenAsset, fiat?: number): RowAmount {
  if (!token || !fiat) return { value: '0', fiat: '0' }
  return {
    value: balanceFormatter.format(fiat / parseFloat(token.fiatConversion)),
    fiat: fiatFormatter.format(fiat),
  }
}

interface AssetsTableContentProps {
  rows: RowItem[]
  selected: string[]
  classes: Record<string, string>
}

function AssetsTableContent({ rows, classes, selected }: AssetsTableContentProps): React.ReactElement {
  const dispatch = useRootDispatch()

  if (!rows.length) {
    return <EmptyTableContent />
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

  const items = rows.map((row, index) => {
    const isItemSelected = isSelected(row.address)
    const labelId = `enhanced-table-checkbox-${index}`

    return (
      <TableRow
        hover
        key={row.symbol}
        classes={{ selected: classes.bgTransparent }}
        className={classNames({ [classes.blur]: !isItemSelected })}
        onClick={(event) => handleClick(event, row.address)}
        tabIndex={-1}
        role="checkbox"
        selected={isItemSelected}
        aria-checked={isItemSelected}
      >
        <TableScrollSpacer className={classes.startScrollSpacer} />
        <TableCell className={classNames(classes.bodyCell, classes.checkCell)} padding="checkbox">
          <ZodiacCheckbox checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }} />
        </TableCell>
        <TableCell className={classes.bodyCell} id={labelId} scope="row" align="right">
          <Row justifyContent="end" alignItems="center">
            {row.symbolLogoUrl ? <img src={row.symbolLogoUrl} alt="" className={classes.tokenLogo} /> : null}
            <Typography className={classes.symbolText} variant="body1">
              {row.symbol}
            </Typography>
          </Row>
        </TableCell>
        <TableCell className={classNames(classes.bgColumn, classes.bodyCell)} align="right">
          <TextAmount>
            {row.gas.value} gwei ${row.gas.fiat}
          </TextAmount>
        </TableCell>
        <TableCell className={classes.bodyCell} align="right">
          <TextAmount>
            {row.holding.value} {row.symbol} ${row.holding.fiat}
          </TextAmount>
        </TableCell>
        <TableCell className={classNames(classes.bgColumn, classes.bodyCell)} align="right">
          <TextAmount>
            {row.claimable.value} {row.symbol} ${row.claimable.fiat}
          </TextAmount>
        </TableCell>
        <TableScrollSpacer className={classes.endScrollSpacer} />
      </TableRow>
    )
  })

  return <TableBody>{items}</TableBody>
}

export function AssetsTable({ assets, token, query }: AssetsTableProps): React.ReactElement {
  const classes = useStyles()
  const [sort, setSort] = React.useState<Sort>('asc')

  const dispatch = useRootDispatch()
  const selected = useRootSelector(getSelectedTokens)

  const getClaimAmount = useAmountRate()

  const rows = useMemo((): RowItem[] => {
    const ethToken = assets.find((asset) => asset.tokenInfo.symbol === 'ETH')
    return assets
      .filter((assetToken) => token?.address !== assetToken.tokenInfo.address)
      .map((token): RowItem => {
        const claimable = getClaimAmount(ethers.BigNumber.from(token.balance))

        return {
          address: token.tokenInfo.address,
          name: token.tokenInfo.name,
          symbol: token.tokenInfo.symbol,
          symbolLogoUrl: token.tokenInfo.logoUri,
          claimable: formatRowAmount(token, claimable),
          gas: formatRowAmount(ethToken, token.gas, 9, false),
          holding: formatRowAmount(token, token.balance),
        }
      })
  }, [assets, getClaimAmount, token?.address])

  const totals = useMemo(() => {
    const tokenAsset = assets.find((asset) => asset.tokenInfo.symbol === 'ETH')
    const tokens = selected
      .map((address) => {
        return assets.find((tokenAsset) => tokenAsset.tokenInfo.address === address)
      })
      .filter((token): token is TokenAsset => token !== undefined)

    const gasTotal = tokens.reduce((acc, token) => acc.add(token.gas), BigNumber.from(0))
    const holdingTotal = tokens.reduce((acc, token) => acc + getFiatAmount(token), 0)
    const claimRate = parseFloat(ethers.utils.formatUnits(getClaimAmount(BigNumber.from(10).pow(18)), 18))
    const claimableTotal = tokens.reduce((acc, token) => acc + claimRate * getFiatAmount(token), 0)

    return {
      gas: formatRowAmount(tokenAsset, gasTotal, 9, false),
      holding: formatRowFiatAmount(tokenAsset, holdingTotal),
      claimable: formatRowFiatAmount(tokenAsset, claimableTotal),
    }
  }, [assets, getClaimAmount, selected])

  const handleRequestSort = () => setSort(sort === 'asc' ? 'desc' : 'asc')

  const handleSelectAllClick = (checked: boolean) => {
    const addresses = checked ? rows.map((n) => n.address) : []
    dispatch(setSelectedTokens(addresses))
  }

  const filteredRows = !query ? rows : rows.filter((row) => row.symbol.includes(query) || row.name?.includes(query))

  return (
    <TableContainer className={classes.root}>
      <Table className={classes.table} aria-labelledby="tableTitle" aria-label="enhanced table">
        <EnhancedTableHead
          classes={classes}
          numSelected={selected.length}
          order={sort}
          onSelectAllClick={(event) => handleSelectAllClick(event.target.checked)}
          onRequestSort={handleRequestSort}
          rowCount={rows.length}
        />
        <AssetsTableContent
          classes={classes}
          rows={stableSort(filteredRows, getComparator(sort))}
          selected={selected}
        />
        <TableFooter>
          <TableRow role="checkbox" tabIndex={-1}>
            <TableScrollSpacer className={classes.startScrollSpacer} />
            <TableCell className={classes.footerCell} padding="checkbox">
              <Typography className={classes.summationSymbol} variant="body1">
                ∑
              </Typography>
            </TableCell>
            <TableCell className={classes.footerCell} scope="row" align="right">
              <Row justifyContent="end" alignItems="center">
                <Typography className={classes.symbolText} variant="body1">
                  {selected.length} tokens
                </Typography>
              </Row>
            </TableCell>
            <TableCell className={classNames(classes.bgColumn, classes.footerCell)} align="right">
              <TextAmount>
                {totals.gas.value} gwei ${totals.gas.fiat}
              </TextAmount>
            </TableCell>
            <TableCell className={classes.footerCell} align="right">
              <TextAmount>
                ~{totals.holding.value} ETH ${totals.holding.fiat}
              </TextAmount>
            </TableCell>
            <TableCell className={classNames(classes.bgColumn, classes.footerCell)} align="right">
              <TextAmount>
                ~{totals.claimable.value} ETH ${totals.claimable.fiat}
              </TextAmount>
            </TableCell>
            <TableScrollSpacer className={classes.endScrollSpacer} />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  )
}
