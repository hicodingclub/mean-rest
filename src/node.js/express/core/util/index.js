//Re-order the router stack of an express router: move "num" layers in the stask from tail to head
const moveRouterStackTailToHead = function(router, num) {
  if(!router || !router.stack) return router;
  const len = router.stack.length;
  if (num >= len) return router;
  const split_index = len - num;
  let part1 = router.stack.slice(0, split_index);
  let part2 = router.stack.slice(split_index, len);
  router.stack = part2.concat(part1);
  return router;
}
//Re-order the router stack of an express router: move the last layer in the stack forward "num" numbers
const moveRouterStackTailForward = function(router, num) {
  if(!router || !router.stack) return router;
  const len = router.stack.length;
  if (len <= 1) return router;
  const last = router.stack[len - 1]
  let others = router.stack.slice(0, len - 1);
  const others_len = others.length
  if (num > others_len) num = others_len;
  const insert_index = others_len - num;
  others.splice(insert_index, 0, last); //return removed array
  router.stack = others
  return router;
}


const randomString = function(length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

const archiveDocument = require('./mongo-archive');
module.exports = {
  moveRouterStackTailToHead,
  moveRouterStackTailForward,
  archiveDocument,
}