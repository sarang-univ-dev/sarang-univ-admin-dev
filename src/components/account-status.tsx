import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard } from "lucide-react"

export function AccountStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>예상 계좌 현황</CardTitle>
        <CardDescription>입출금 요약 표</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="1">
          <TabsList className="grid grid-cols-8 w-full mb-6">
            <TabsTrigger value="1">1부</TabsTrigger>
            <TabsTrigger value="2">2부</TabsTrigger>
            <TabsTrigger value="3">3부</TabsTrigger>
            <TabsTrigger value="4">4부</TabsTrigger>
            <TabsTrigger value="5">5부</TabsTrigger>
            <TabsTrigger value="6">6부</TabsTrigger>
            <TabsTrigger value="7">7부</TabsTrigger>
            <TabsTrigger value="8">8부</TabsTrigger>
          </TabsList>

          {[1, 2, 3, 4, 5, 6, 7, 8].map((department) => (
            <TabsContent key={department} value={department.toString()}>
              <div className="flex items-center gap-4 mb-6">
                <CreditCard className="h-6 w-6" />
                <div>
                  <div className="text-lg font-bold">7777-77-1357924 기업은행</div>
                  <div className="text-sm text-muted-foreground">박서연</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/3">항목</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>예상 입금 금액</TableCell>
                    <TableCell className="text-right font-medium">2,700,000원</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>예상 출금 금액</TableCell>
                    <TableCell className="text-right font-medium">1,100,000원</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>예상 잔액</TableCell>
                    <TableCell className="text-right font-bold">1,600,000원</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
