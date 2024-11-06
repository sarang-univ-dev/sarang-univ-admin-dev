// "use client";

// import { useState, useMemo } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult
// } from "@hello-pangea/dnd";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Calendar, User, ChevronUp, ChevronDown } from "lucide-react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";

// type ScheduleType = "BREAKFAST" | "LUNCH" | "DINNER" | "SLEEP";

// type MemoType = "간사" | "새가족" | "군지체" | "리더" | "헬퍼" | "SC";

// type UserData = {
//   user: {
//     id: number;
//     name: string;
//     univ_group_number: number;
//     grade_number: number;
//     gender: "male" | "female";
//     gbs_id: number | null;
//   };
//   register_schedule: number[];
//   memo: {
//     type: MemoType | null;
//     note: string | null;
//   };
// };

// type RegisterSchedule = {
//   id: number;
//   date: string;
//   type: ScheduleType;
// };

// type GBSData = {
//   id: number;
//   number: number;
//   leader: {
//     id: number;
//     name: string;
//     univ_group_number: number;
//     grade_number: number;
//     gender: "male" | "female";
//   };
//   memo: string | null;
//   members: UserData[];
// };

// const scheduleTypeMap: { [key in ScheduleType]: string } = {
//   BREAKFAST: "아",
//   LUNCH: "점",
//   DINNER: "저",
//   SLEEP: "숙"
// };

// const mockUsers: UserData[] = [
//   {
//     user: {
//       id: 1,
//       name: "김철수",
//       univ_group_number: 3,
//       grade_number: 2,
//       gender: "male",
//       gbs_id: null
//     },
//     register_schedule: [1, 2, 3, 4],
//     memo: {
//       type: "간사",
//       note: "형제 리더로 라인업"
//     }
//   },
//   {
//     user: {
//       id: 2,
//       name: "이영희",
//       univ_group_number: 5,
//       grade_number: 3,
//       gender: "female",
//       gbs_id: null
//     },
//     register_schedule: [5, 6],
//     memo: {
//       type: "새가족",
//       note: "첫 참석, 환영 필요"
//     }
//   },
//   {
//     user: {
//       id: 3,
//       name: "박민수",
//       univ_group_number: 1,
//       grade_number: 4,
//       gender: "male",
//       gbs_id: null
//     },
//     register_schedule: [7, 8, 9, 10],
//     memo: {
//       type: "군지체",
//       note: "6개월 후 전역 예정"
//     }
//   },
//   {
//     user: {
//       id: 4,
//       name: "최수민",
//       univ_group_number: 2,
//       grade_number: 1,
//       gender: "female",
//       gbs_id: null
//     },
//     register_schedule: [1, 2, 3],
//     memo: {
//       type: "리더",
//       note: "리더 후보"
//     }
//   },
//   {
//     user: {
//       id: 5,
//       name: "강현우",
//       univ_group_number: 4,
//       grade_number: 2,
//       gender: "male",
//       gbs_id: null
//     },
//     register_schedule: [4, 5, 6],
//     memo: {
//       type: "헬퍼",
//       note: null
//     }
//   }
// ];

// const mockGBSData: GBSData[] = [
//   {
//     id: 1,
//     number: 101,
//     leader: {
//       id: 6,
//       name: "홍길동",
//       univ_group_number: 2,
//       grade_number: 4,
//       gender: "male"
//     },
//     memo: "신입 GBS",
//     members: []
//   },
//   {
//     id: 2,
//     number: 201,
//     leader: {
//       id: 7,
//       name: "김지영",
//       univ_group_number: 3,
//       grade_number: 3,
//       gender: "female"
//     },
//     memo: null,
//     members: []
//   },
//   {
//     id: 3,
//     number: 301,
//     leader: {
//       id: 8,
//       name: "이상훈",
//       univ_group_number: 1,
//       grade_number: 4,
//       gender: "male"
//     },
//     memo: "경험 많은 GBS",
//     members: []
//   },
//   {
//     id: 4,
//     number: 401,
//     leader: {
//       id: 9,
//       name: "오영수",
//       univ_group_number: 4,
//       grade_number: 3,
//       gender: "male"
//     },
//     memo: null,
//     members: []
//   },
//   {
//     id: 5,
//     number: 501,
//     leader: {
//       id: 10,
//       name: "김민지",
//       univ_group_number: 5,
//       grade_number: 2,
//       gender: "female"
//     },
//     memo: "활동적인 GBS",
//     members: []
//   }
// ];

// const mockRegisterSchedules: RegisterSchedule[] = [
//   { id: 1, date: "2024-10-23T00:00:00", type: "BREAKFAST" },
//   { id: 2, date: "2024-10-23T00:00:00", type: "LUNCH" },
//   { id: 3, date: "2024-10-23T00:00:00", type: "DINNER" },
//   { id: 4, date: "2024-10-23T00:00:00", type: "SLEEP" },
//   { id: 5, date: "2024-10-24T00:00:00", type: "BREAKFAST" },
//   { id: 6, date: "2024-10-24T00:00:00", type: "DINNER" },
//   { id: 7, date: "2024-10-25T00:00:00", type: "LUNCH" },
//   { id: 8, date: "2024-10-25T00:00:00", type: "SLEEP" },
//   { id: 9, date: "2024-10-26T00:00:00", type: "BREAKFAST" },
//   { id: 10, date: "2024-10-26T00:00:00", type: "DINNER" }
// ];

// export default function GBSAllocationPage() {
//   const [unassignedUsers, setUnassignedUsers] = useState<UserData[]>(mockUsers);
//   const [gbsData, setGBSData] = useState<GBSData[]>(mockGBSData);
//   const [sortField, setSortField] = useState<
//     "name" | "univ_group_number" | "grade_number"
//   >("name");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const [filterText, setFilterText] = useState("");
//   const [filterMemoType, setFilterMemoType] = useState<string>("ALL");
//   const [filterGender, setFilterGender] = useState<"male" | "female" | "ALL">(
//     "ALL"
//   );
//   const [filterUnivGroupNumber, setFilterUnivGroupNumber] = useState<
//     number | "ALL"
//   >("ALL");

//   const gbsGroups = useMemo(() => {
//     const groups: { [key: string]: GBSData[] } = {};
//     gbsData.forEach((gbs) => {
//       const groupKey = Math.floor(gbs.number / 100) * 100;
//       if (!groups[groupKey]) groups[groupKey] = [];
//       groups[groupKey].push(gbs);
//     });
//     return groups;
//   }, [gbsData]);

//   const filteredAndSortedUsers = useMemo(() => {
//     return unassignedUsers
//       .filter((user) => {
//         const nameMatch = user.user.name
//           .toLowerCase()
//           .includes(filterText.toLowerCase());
//         const memoTypeMatch =
//           filterMemoType === "ALL" || (user.memo.type ?? "") === filterMemoType;
//         const genderMatch =
//           filterGender === "ALL" || user.user.gender === filterGender;
//         const univGroupMatch =
//           filterUnivGroupNumber === "ALL" ||
//           user.user.univ_group_number === filterUnivGroupNumber;
//         return nameMatch && memoTypeMatch && genderMatch && univGroupMatch;
//       })
//       .sort((a, b) => {
//         if (a.user[sortField] < b.user[sortField])
//           return sortOrder === "asc" ? -1 : 1;
//         if (a.user[sortField] > b.user[sortField])
//           return sortOrder === "asc" ? 1 : -1;
//         return 0;
//       });
//   }, [
//     unassignedUsers,
//     sortField,
//     sortOrder,
//     filterText,
//     filterMemoType,
//     filterGender,
//     filterUnivGroupNumber
//   ]);

//   const onDragEnd = (result: DropResult) => {
//     const { source, destination } = result;

//     if (!destination) return;

//     if (
//       source.droppableId === "unassigned" &&
//       destination.droppableId !== "unassigned"
//     ) {
//       // Moving from unassigned to a GBS
//       const userId = parseInt(result.draggableId);
//       const gbsId = parseInt(destination.droppableId);

//       const user = unassignedUsers.find((u) => u.user.id === userId);
//       if (user) {
//         setUnassignedUsers((prev) => prev.filter((u) => u.user.id !== userId));
//         setGBSData((prev) =>
//           prev.map((gbs) =>
//             gbs.id === gbsId
//               ? {
//                   ...gbs,
//                   members: [
//                     ...gbs.members,
//                     { ...user, user: { ...user.user, gbs_id: gbsId } }
//                   ]
//                 }
//               : gbs
//           )
//         );
//       }
//     } else if (
//       source.droppableId !== "unassigned" &&
//       destination.droppableId === "unassigned"
//     ) {
//       // Moving from a GBS to unassigned
//       const userId = parseInt(result.draggableId);
//       const sourceGbsId = parseInt(source.droppableId);

//       const sourceGbs = gbsData.find((gbs) => gbs.id === sourceGbsId);
//       const user = sourceGbs?.members.find((u) => u.user.id === userId);

//       if (user) {
//         setUnassignedUsers((prev) => [
//           ...prev,
//           { ...user, user: { ...user.user, gbs_id: null } }
//         ]);
//         setGBSData((prev) =>
//           prev.map((gbs) =>
//             gbs.id === sourceGbsId
//               ? {
//                   ...gbs,
//                   members: gbs.members.filter((u) => u.user.id !== userId)
//                 }
//               : gbs
//           )
//         );
//       }
//     } else if (source.droppableId !== destination.droppableId) {
//       // Moving between GBS groups
//       const userId = parseInt(result.draggableId);
//       const sourceGbsId = parseInt(source.droppableId);
//       const destGbsId = parseInt(destination.droppableId);

//       const sourceGbs = gbsData.find((gbs) => gbs.id === sourceGbsId);
//       const user = sourceGbs?.members.find((u) => u.user.id === userId);

//       if (user) {
//         setGBSData((prev) =>
//           prev.map((gbs) => {
//             if (gbs.id === sourceGbsId) {
//               return {
//                 ...gbs,
//                 members: gbs.members.filter((u) => u.user.id !== userId)
//               };
//             } else if (gbs.id === destGbsId) {
//               return {
//                 ...gbs,
//                 members: [
//                   ...gbs.members,
//                   { ...user, user: { ...user.user, gbs_id: destGbsId } }
//                 ]
//               };
//             }
//             return gbs;
//           })
//         );
//       }
//     }
//   };

//   const toggleSort = (field: "name" | "univ_group_number" | "grade_number") => {
//     if (sortField === field) {
//       setSortOrder(sortOrder === "asc" ? "desc" : "asc");
//     } else {
//       setSortField(field);
//       setSortOrder("asc");
//     }
//   };

//   return (
//     <DragDropContext onDragEnd={onDragEnd}>
//       <div className="flex h-screen overflow-hidden">
//         {/* Unassigned Users (Left Side) */}
//         <div className="w-1/3 p-4 bg-gray-100 flex flex-col">
//           <h2 className="text-xl font-bold mb-4">Unassigned Users</h2>
//           <div className="mb-4 space-y-2">
//             <Input
//               placeholder="Filter by name"
//               value={filterText}
//               onChange={(e) => setFilterText(e.target.value)}
//             />
//             <Select
//               value={filterMemoType}
//               onValueChange={(value: string) => setFilterMemoType(value)}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Filter by memo type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="ALL">All Types</SelectItem>
//                 <SelectItem value="간사">간사</SelectItem>
//                 <SelectItem value="새가족">새가족</SelectItem>
//                 <SelectItem value="군지체">군지체</SelectItem>
//                 <SelectItem value="리더">리더</SelectItem>
//                 <SelectItem value="헬퍼">헬퍼</SelectItem>
//                 <SelectItem value="SC">SC</SelectItem>
//               </SelectContent>
//             </Select>
//             <Select
//               value={filterGender}
//               onValueChange={(value: "male" | "female" | "ALL") =>
//                 setFilterGender(value)
//               }
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Filter by gender" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="ALL">All Genders</SelectItem>
//                 <SelectItem value="male">Male</SelectItem>
//                 <SelectItem value="female">Female</SelectItem>
//               </SelectContent>
//             </Select>
//             <Select
//               value={filterUnivGroupNumber.toString()}
//               onValueChange={(value) =>
//                 setFilterUnivGroupNumber(
//                   value === "ALL" ? "ALL" : parseInt(value)
//                 )
//               }
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Filter by Group" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="ALL">All Groups</SelectItem>
//                 <SelectItem value="1">Group 1</SelectItem>
//                 <SelectItem value="2">Group 2</SelectItem>
//                 <SelectItem value="3">Group 3</SelectItem>
//                 <SelectItem value="4">Group 4</SelectItem>
//                 <SelectItem value="5">Group 5</SelectItem>
//               </SelectContent>
//             </Select>
//             <div className="flex space-x-2">
//               <Button
//                 onClick={() => toggleSort("name")}
//                 variant="outline"
//                 size="sm"
//               >
//                 Name{" "}
//                 {sortField === "name" &&
//                   (sortOrder === "asc" ? (
//                     <ChevronUp className="w-4 h-4" />
//                   ) : (
//                     <ChevronDown className="w-4 h-4" />
//                   ))}
//               </Button>
//               <Button
//                 onClick={() => toggleSort("univ_group_number")}
//                 variant="outline"
//                 size="sm"
//               >
//                 Group{" "}
//                 {sortField === "univ_group_number" &&
//                   (sortOrder === "asc" ? (
//                     <ChevronUp className="w-4 h-4" />
//                   ) : (
//                     <ChevronDown className="w-4 h-4" />
//                   ))}
//               </Button>
//               <Button
//                 onClick={() => toggleSort("grade_number")}
//                 variant="outline"
//                 size="sm"
//               >
//                 Grade{" "}
//                 {sortField === "grade_number" &&
//                   (sortOrder === "asc" ? (
//                     <ChevronUp className="w-4 h-4" />
//                   ) : (
//                     <ChevronDown className="w-4 h-4" />
//                   ))}
//               </Button>
//             </div>
//           </div>
//           <Droppable droppableId="unassigned">
//             {(provided) => (
//               <ScrollArea className="flex-grow">
//                 <div
//                   {...provided.droppableProps}
//                   ref={provided.innerRef}
//                   className="space-y-4"
//                 >
//                   {filteredAndSortedUsers.map((user, index) => (
//                     <DraggableUserCard
//                       key={user.user.id}
//                       user={user}
//                       index={index}
//                     />
//                   ))}
//                   {provided.placeholder}
//                 </div>
//               </ScrollArea>
//             )}
//           </Droppable>
//         </div>

//         {/* GBS Allocation (Right Side) */}
//         <div className="w-2/3 p-4 bg-white flex flex-col">
//           <h2 className="text-xl font-bold mb-4">GBS Allocation</h2>
//           <Tabs
//             defaultValue={Object.keys(gbsGroups)[0]}
//             className="flex-grow flex flex-col"
//           >
//             <TabsList>
//               {Object.keys(gbsGroups).map((group) => (
//                 <TabsTrigger key={group} value={group}>
//                   {group}s
//                 </TabsTrigger>
//               ))}
//             </TabsList>
//             {Object.entries(gbsGroups).map(([group, gbsList]) => (
//               <TabsContent key={group} value={group} className="flex-grow">
//                 <ScrollArea className="h-full">
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {gbsList.map((gbs) => (
//                       <GBSDropZone key={gbs.id} gbs={gbs} />
//                     ))}
//                   </div>
//                 </ScrollArea>
//               </TabsContent>
//             ))}
//           </Tabs>
//         </div>
//       </div>
//     </DragDropContext>
//   );
// }

// function DraggableUserCard({ user, index }: { user: UserData; index: number }) {
//   const { register_schedule, memo } = user;
//   const userInfo = `${user.user.univ_group_number}부 ${
//     user.user.gender === "male" ? "남" : "여"
//   }${user.user.grade_number} ${user.user.name}`;

//   const isFullyRegistered = mockRegisterSchedules.every((s) =>
//     register_schedule.includes(s.id)
//   );

//   const userSchedules = mockRegisterSchedules.filter((s) =>
//     register_schedule.includes(s.id)
//   );

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     const dayName = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
//     return {
//       formatted: `${date.getMonth() + 1}/${date.getDate()}(${dayName})`,
//       dayName,
//       date: date.toISOString().split("T")[0]
//     };
//   };

//   const getScheduleText = (types: ScheduleType[], dayName: string) => {
//     return types.map((type) => `${dayName}${scheduleTypeMap[type]}`).join(", ");
//   };

//   const groupedSchedules = userSchedules.reduce(
//     (acc, schedule) => {
//       const { formatted, dayName, date } = formatDate(schedule.date);
//       if (!acc[date]) {
//         acc[date] = { formatted, dayName, types: [] as ScheduleType[] };
//       }
//       acc[date].types.push(schedule.type);
//       return acc;
//     },
//     {} as {
//       [key: string]: {
//         formatted: string;
//         dayName: string;
//         types: ScheduleType[];
//       };
//     }
//   );

//   return (
//     <Draggable draggableId={user.user.id.toString()} index={index}>
//       {(provided, snapshot) => (
//         <div
//           ref={provided.innerRef}
//           {...provided.draggableProps}
//           {...provided.dragHandleProps}
//           className="mb-4 cursor-move"
//         >
//           <Card
//             className={`hover:shadow-md transition-shadow duration-200 ${
//               snapshot.isDragging ? "bg-gray-200" : ""
//             } ${isFullyRegistered ? "bg-green-100" : ""} ${
//               memo.note ? "border-2 border-indigo-500" : ""
//             }`}
//           >
//             <CardContent className="p-4">
//               <div className="flex justify-between items-start mb-2">
//                 <h3 className="text-lg font-semibold">{userInfo}</h3>
//                 <div className="flex gap-2">
//                   {memo.type && (
//                     <Badge className={`${getBadgeColor(memo.type)} text-white`}>
//                       {memo.type}
//                     </Badge>
//                   )}
//                   <Badge
//                     className={`${
//                       user.user.gender === "male"
//                         ? "bg-blue-500"
//                         : "bg-pink-500"
//                     } text-white`}
//                   >
//                     {user.user.gender === "male" ? "남" : "여"}
//                   </Badge>
//                   {isFullyRegistered ? (
//                     <Badge className="bg-green-500 text-white">전참</Badge>
//                   ) : (
//                     <Badge className="bg-yellow-500 text-white">부분참</Badge>
//                   )}
//                 </div>
//               </div>
//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center">
//                   <Calendar className="w-4 h-4 mr-2" />
//                   <span>
//                     일정:{" "}
//                     {isFullyRegistered
//                       ? "전참"
//                       : Object.entries(groupedSchedules)
//                           .map(
//                             ([date, { formatted, dayName, types }]) =>
//                               `${formatted} ${getScheduleText(types, dayName)}`
//                           )
//                           .join(", ")}
//                   </span>
//                 </div>
//                 {memo.note && (
//                   <div className="flex items-center">
//                     <User className="w-4 h-4 mr-2" />
//                     <span>메모: {memo.note}</span>
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}
//     </Draggable>
//   );
// }

// function GBSDropZone({ gbs }: { gbs: GBSData }) {
//   const maleCount = gbs.members.filter((m) => m.user.gender === "male").length;
//   const femaleCount = gbs.members.filter(
//     (m) => m.user.gender === "female"
//   ).length;
//   const totalMembers = gbs.members.length;

//   const fullRegisterCount = gbs.members.filter((m) =>
//     mockRegisterSchedules.every((s) => m.register_schedule.includes(s.id))
//   ).length;

//   const partialRegisterCount = totalMembers - fullRegisterCount;

//   return (
//     <Droppable droppableId={gbs.id.toString()}>
//       {(provided) => (
//         <Card {...provided.droppableProps} ref={provided.innerRef}>
//           <CardHeader>
//             <CardTitle>GBS {gbs.number}</CardTitle>
//             <div className="text-sm text-gray-500">
//               Leader: {gbs.leader.name} ({gbs.leader.univ_group_number}부{" "}
//               {gbs.leader.gender === "male" ? "남" : "여"}
//               {gbs.leader.grade_number})
//             </div>
//             {gbs.memo && <div className="text-sm italic">{gbs.memo}</div>}
//             <div className="flex gap-2 mt-2 grid grid-cols-3">
//               <Badge className="bg-blue-500 text-white whitespace-nowrap">{maleCount} 남</Badge>
//               <Badge className="bg-pink-500 text-white whitespace-nowrap">{femaleCount} 여</Badge>
//               <Badge className="bg-green-500 text-white whitespace-nowrap">
//                 전참: {fullRegisterCount}
//               </Badge>
//               <Badge className="bg-yellow-500 text-white whitespace-nowrap">
//                 부분참: {partialRegisterCount}
//               </Badge>
//               <Badge className="bg-gray-500 text-white whitespace-nowrap">
//                 Total: {totalMembers}
//               </Badge>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <ScrollArea className="h-[200px]">
//               {gbs.members.map((user, index) => (
//                 <DraggableUserCard
//                   key={user.user.id}
//                   user={user}
//                   index={index}
//                 />
//               ))}
//             </ScrollArea>
//             {provided.placeholder}
//           </CardContent>
//         </Card>
//       )}
//     </Droppable>
//   );
// }

// function getBadgeColor(type: MemoType | null) {
//   switch (type) {
//     case "간사":
//       return "bg-blue-500";
//     case "새가족":
//       return "bg-green-500";
//     case "군지체":
//       return "bg-yellow-500";
//     case "리더":
//       return "bg-purple-500";
//     case "헬퍼":
//       return "bg-pink-500";
//     case "SC":
//       return "bg-indigo-500";
//     default:
//       return "bg-gray-500";
//   }
// }
