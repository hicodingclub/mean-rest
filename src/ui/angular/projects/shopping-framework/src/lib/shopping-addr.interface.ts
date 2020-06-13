export interface ShoppingAddr {
  name?: string,

  line1: string;
  line2?: string;
  city: string;
  state: string;
  country?: string;
  zipCode: string;

  phone?: string,
}

export const ShoppingAddrToString = function (addr: ShoppingAddr): string {
  let str = '';
  if (addr.name) {
    str += `${addr.name}`;
  }
  str += ` Address:`
  if (addr.line1) {
    str += ` ${addr.line1},`
  }
  if (addr.line2) {
    str += ` ${addr.line2},`
  }
  if (addr.city) {
    str += ` ${addr.city},`
  }
  if (addr.state) {
    str += ` ${addr.state}`
  }
  if (addr.zipCode) {
    str += ` ${addr.zipCode}`
  }
  if (addr.country) {
    str += `, ${addr.country}`
  }
  if (addr.phone) {
    str += ` Phone: ${addr.phone}`
  }
  return str;
}