export const formatDate = (dateInput: string | Date | null) => {
  if (!dateInput) return "";
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const days = ["주일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}년 ${
    date.getMonth() + 1
  }월 ${date.getDate()}일 (${
    days[date.getDay()]
  }) ${date.getHours()}시 ${date.getMinutes()}분`;
};

export const formatSimpleDate = (dateString: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const days = ["주", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
};
