// helpers.ts
export function truncateAddress(address: string): string {
    if (address.length <= 10) {
      return address;
    } else {
      const start = address.substring(0, 6);
      const end = address.substring(address.length - 4);
      return `${start}...${end}`;
    }
  }