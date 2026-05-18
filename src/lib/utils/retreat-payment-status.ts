import { UserRetreatRegistrationPaymentStatus } from "@/types";

export const RETREAT_PAYMENT_STATUS_ORDER = [
  UserRetreatRegistrationPaymentStatus.PENDING,
  UserRetreatRegistrationPaymentStatus.PAID,
  UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST,
  UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST,
  UserRetreatRegistrationPaymentStatus.CANCEL_ONGOING,
  UserRetreatRegistrationPaymentStatus.CANCELED,
  UserRetreatRegistrationPaymentStatus.REFUND_ONGOING,
  UserRetreatRegistrationPaymentStatus.REFUNDED,
] as const;

export function normalizeRetreatPaymentStatus(
  status: UserRetreatRegistrationPaymentStatus
) {
  if (status === UserRetreatRegistrationPaymentStatus.REFUND_REQUEST) {
    return UserRetreatRegistrationPaymentStatus.REFUND_ONGOING;
  }

  return status;
}
