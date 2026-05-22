import { posAPI } from './pos';

export const salesAPI = {
  getAll: posAPI.getSales,
  getById: posAPI.getSale,
  create: posAPI.createSale,
  refund: posAPI.refundSale,
  partialRefund: posAPI.partialRefund,
  print: posAPI.printSale,
  holdCart: posAPI.holdCart,
  getHoldCarts: posAPI.getHoldCarts,
  restoreCart: posAPI.restoreCart,
  deleteHoldCart: posAPI.deleteHoldCart,
};
