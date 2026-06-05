/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  // tsconfig 의 "@/..." 경로 alias 를 jest 모듈 해석에 매핑
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // 프로젝트 tsconfig 는 module: esnext 라 jest(CJS)용으로 commonjs 로만 덮어쓴다.
  // (ts-jest isolatedModules 는 끄둔다 → 타입 전용 import 가 정상 elide 되어
  //  React/SWR 훅 모듈이 런타임에 로드되지 않음)
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs" } }],
  },
};
