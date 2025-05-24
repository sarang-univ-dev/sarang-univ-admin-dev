export const ERROR_DICT: { [key: string]: string } = {
  "Please enter a nickname": "닉네임을 입력해주세요.",
  "nickname exists": "이미 사용 중인 닉네임입니다.",
  "email exists": "이미 사용 중인 이메일입니다.",
  '"email" must be a valid email': "잘못된 이메일 형식입니다.",
  '"email" is not allowed to be empty': "이메일을 입력해주세요.",
};

export const TIME = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 60 * 60 * 24,
  WEEK: 60 * 60 * 24 * 7,
  MONTH: 60 * 60 * 24 * 30,
  YEAR: 60 * 60 * 24 * 365,
};
