export const formatDate = (dateString: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const days = ["주일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}년 ${
    date.getMonth() + 1
  }월 ${date.getDate()}일 (${
    days[date.getDay()]
  }) ${date.getHours()}시 ${date.getMinutes()}분`;
};
