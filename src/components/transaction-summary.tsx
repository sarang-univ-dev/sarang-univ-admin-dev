import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TransactionSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>입출금 요약</CardTitle>
        <CardDescription>전체 입출금 현황</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>구분</TableHead>
              <TableHead className="text-right">금액</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>총 입금액</TableCell>
              <TableCell className="text-right">14,025,000원</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>총 환불액</TableCell>
              <TableCell className="text-right">385,000원</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>순 입금액</TableCell>
              <TableCell className="text-right font-bold">13,640,000원</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
