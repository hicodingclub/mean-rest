//Re-order the router stack of an express router: move "num" layers in the stask from tail to head
const moveRouterStackTailToHead = function(router, num) {
  if(!router || !router.stack) return router;
  let len = router.stack.length;
  if (num >= len) return router;
  let split_index = len - num;
  let part1 = router.stack.slice(0, split_index);
  let part2 = router.stack.slice(split_index, len);
  router.stack = part2.concat(part1);
  return router;
}

module.exports = {
  moveRouterStackTailToHead: moveRouterStackTailToHead
}