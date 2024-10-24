'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface User {
  id: string
  name: string
  userType: 'new' | 'military' | 'staff' | null
  schedule: {
    [key: string]: boolean
  }
}

const mockSearchApi = async (name: string): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  return [
    { id: '1', name: 'John Doe', userType: 'new', schedule: { day1: true, day2: false, day3: true } },
    { id: '2', name: 'Jane Smith', userType: 'military', schedule: { day1: false, day2: true, day3: true } },
    { id: '3', name: 'Alice Johnson', userType: null, schedule: { day1: true, day2: true, day3: false } },
  ]
}

const mockUpdateUserType = async (userId: string, newType: string) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log(`Updated user ${userId} to type ${newType}`)
}

const mockUpdateUserSchedule = async (userId: string, newSchedule: { [key: string]: boolean }) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log(`Updated user ${userId} schedule:`, newSchedule)
}

export function RetreatRegistrationModifierComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [modifiedUsers, setModifiedUsers] = useState<{ [key: string]: Partial<User> }>({})
  const [editableRows, setEditableRows] = useState<{ [key: string]: boolean }>({})

  const handleSearch = async () => {
    const results = await mockSearchApi(searchTerm)
    setSearchResults(results)
    setModifiedUsers({})
    setEditableRows({})
  }

  const handleUserTypeChange = (userId: string, newType: User['userType']) => {
    setModifiedUsers(prev => {
      const originalUser = searchResults.find(user => user.id === userId)
      if (originalUser?.userType === newType) {
        const { userType, ...rest } = prev[userId] || {}
        return { ...prev, [userId]: Object.keys(rest).length ? rest : {} }
      }
      return { ...prev, [userId]: { ...prev[userId], userType: newType } }
    })
  }

  const handleScheduleChange = (userId: string, day: string, checked: boolean) => {
    setModifiedUsers(prev => {
      const originalUser = searchResults.find(user => user.id === userId)
      const newSchedule = { ...(prev[userId]?.schedule ?? {}), [day]: checked }
      if (JSON.stringify(newSchedule) === JSON.stringify(originalUser?.schedule)) {
        const { schedule, ...rest } = prev[userId] || {}
        return { ...prev, [userId]: Object.keys(rest).length ? rest : {} }
      }
      return { ...prev, [userId]: { ...prev[userId], schedule: newSchedule } }
    })
  }

  const handleSubmit = async (userId: string) => {
    const modifications = modifiedUsers[userId]
    if (modifications.userType) {
      await mockUpdateUserType(userId, modifications.userType)
    }
    if (modifications.schedule) {
      await mockUpdateUserSchedule(userId, modifications.schedule)
    }
    setModifiedUsers(prev => {
      const { [userId]: _, ...rest } = prev
      return rest
    })
    setEditableRows(prev => ({ ...prev, [userId]: false }))
  }

  const toggleScheduleEditing = (userId: string) => {
    setEditableRows(prev => ({ ...prev, [userId]: !prev[userId] }))
  }

  const isRowModified = (userId: string) => {
    return !!modifiedUsers[userId] && Object.keys(modifiedUsers[userId]).length > 0
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Retreat Registration Modifier</h1>
      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="Enter user name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      {searchResults.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>사용자 구분</TableHead>
              <TableHead>Day 1</TableHead>
              <TableHead>Day 2</TableHead>
              <TableHead>Day 3</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchResults.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{modifiedUsers[user.id]?.userType ?? user.userType}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={modifiedUsers[user.id]?.schedule?.day1 ?? user.schedule.day1}
                    onCheckedChange={(checked) => handleScheduleChange(user.id, 'day1', checked as boolean)}
                    disabled={!editableRows[user.id]}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={modifiedUsers[user.id]?.schedule?.day2 ?? user.schedule.day2}
                    onCheckedChange={(checked) => handleScheduleChange(user.id, 'day2', checked as boolean)}
                    disabled={!editableRows[user.id]}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={modifiedUsers[user.id]?.schedule?.day3 ?? user.schedule.day3}
                    onCheckedChange={(checked) => handleScheduleChange(user.id, 'day3', checked as boolean)}
                    disabled={!editableRows[user.id]}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUserTypeChange(user.id, 'new')}>
                          새가족으로 배정하기
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUserTypeChange(user.id, 'military')}>
                          군지체로 배정하기
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUserTypeChange(user.id, 'staff')}>
                          간사로 배정하기
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleScheduleEditing(user.id)}>
                          {editableRows[user.id] ? '수정 완료' : '일정 수정하기'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      onClick={() => handleSubmit(user.id)}
                      disabled={!isRowModified(user.id)}
                      variant={isRowModified(user.id) ? "default" : "secondary"}
                    >
                      제출하기
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}