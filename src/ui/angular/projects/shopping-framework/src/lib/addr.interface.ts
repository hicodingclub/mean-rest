export interface Address {
  name?: string,

  line1: string;
  line2?: string;
  city: string;
  state: string;
  country?: string;
  zipCode: string;

  phone?: string,
  email?: string,

  // for store address
  contactPerson?: string,
  id?: string,
}

export const AddressToString = function (addr: Address): string {
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
  // At this time, not show email and contactPerson
  return str;
}