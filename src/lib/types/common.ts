import { ComponentProps } from "react";

export interface IconProps extends ComponentProps<"svg"> {
  size?: number | string;
  fill?: string;
}
